public class LMSController {
    @AuraEnabled(cacheable=true)
    public static list<LMS_Books__c>getBooks(string searchField,string keyWord,Boolean isSearch){
        list<LMS_Books__c>books = new list<LMS_Books__c>();
        if(searchField!=null && keyWord!=null && isSearch){
            String q = 'SELECT Id,Name,Book_Name__c,Author__c,Categroy__c,Quantity__c,Description__c,LastModifiedDate FROM LMS_Books__c WHERE '+searchField +' LIKE '+'\'%'+keyWord+'%\'';
            system.debug('query '+q);
            books = database.query(q);
        }
        else{
            books = [SELECT Id,Name,Book_Name__c,Author__c,Categroy__c,Quantity__c,Description__c,LastModifiedDate FROM LMS_Books__c Order By LastModifiedDate DESC LIMIT 20];
        }
        return books;
    }
    
    @AuraEnabled(cacheable=true)
    public static LMS_Users__c getLMSUserDetails(String uid){
        LMS_Users__c userDetails = [SELECT Id,Name,User_Name__c,Phone__c FROM LMS_Users__c WHERE Name =:uid LIMIT 1];
        return userDetails;
    }
    
    @AuraEnabled 
	public static String createBorrowRequest(Id borrowerId, String borrowerUID, Decimal quantity, Date returnDate,Id bookId){
        String returnText = '';
        LMS_Books__c bookDetails = [SELECT Id,Name,Book_Name__c,Quantity__c FROM LMS_Books__c WHERE Id = :bookId LIMIT 1];
        Decimal bookQunatity = bookDetails.Quantity__c;
        if(bookQunatity < quantity){
            if(bookQunatity == 0){
                returnText = 'This book is currently unavailable';
            }
            else{
                returnText = 'The required quantity is not available. Currently only '+bookQunatity+' book(s) availalbe';
            }
        }
        else{
            LMS_Borrowed_Books__c BR = new LMS_Borrowed_Books__c();
            BR.Name = borrowerUID;
            BR.Borrower__c = borrowerId;
            BR.Book__c = bookId;
            BR.Borrow_Date__c = system.today();
            BR.Return_Date__c = returnDate;
            BR.Borrow_Quantity__c = quantity;
            try{
                insert BR;
            }
            catch(Exception e){
                throw new AuraHandledException(e.getMessage());
            }
			bookDetails.Quantity__c =  bookQunatity - quantity;
            try{
                update bookDetails;
            }
            catch(Exception e){
                throw new AuraHandledException(e.getMessage());
            }
        }
        return returnText;
    }
    
    @AuraEnabled(cacheable=true)
    public static list<LMS_Borrowed_Books__c>getBorrowedBooks(string keyWord,Boolean isSearch){
        list<LMS_Borrowed_Books__c>borrowedBooks = new list<LMS_Borrowed_Books__c>();
        if(isSearch && keyWord != '' && keyWord != null){
            String q = 'SELECT Id,Name,Book__c,Book__r.Book_Name__c,Borrow_Date__c,Borrow_Quantity__c,Borrower__c,Borrower__r.User_Name__c,Return_Date__c,Actual_Return_Date__c FROM LMS_Borrowed_Books__c WHERE NAME ' +  'LIKE '+'\'%'+keyWord+'%\' AND Actual_Return_Date__c = null';
            system.debug('query '+q);
            borrowedBooks = database.query(q);
        }
        else if(isSearch && keyWord==''){
            borrowedBooks = [SELECT Id,Name,Book__c,Book__r.Book_Name__c,Borrow_Date__c,Borrow_Quantity__c,Borrower__c,Borrower__r.User_Name__c,Return_Date__c,Actual_Return_Date__c FROM LMS_Borrowed_Books__c WHERE Actual_Return_Date__c = null Order By LastModifiedDate DESC LIMIT 20];
        }
        else{
            borrowedBooks = [SELECT Id,Name,Book__c,Book__r.Book_Name__c,Borrow_Date__c,Borrow_Quantity__c,Borrower__c,Borrower__r.User_Name__c,Return_Date__c,Actual_Return_Date__c FROM LMS_Borrowed_Books__c WHERE Actual_Return_Date__c = null Order By LastModifiedDate DESC LIMIT 20];
        }
        return borrowedBooks;
    }
    
    @AuraEnabled
    public static void returnBook(list<Id> borrowIds){
        set<Id>returnBooks = new set<Id>();
        map<Id,decimal>returnBookCount = new map<Id,decimal>();
        list<LMS_Books__c>booksToProcess = new list<LMS_Books__c>();
        list<LMS_Borrowed_Books__c>borrowBookDetails = [SELECT Id,Name,Book__c,Borrow_Date__c,Borrow_Quantity__c,Borrower__c,Return_Date__c,Actual_Return_Date__c FROM LMS_Borrowed_Books__c WHERE Id IN :borrowIds];
        for(LMS_Borrowed_Books__c borrowBook : borrowBookDetails){
            returnBooks.add(borrowBook.Book__c);
            if(!returnBookCount.containsKey(borrowBook.Book__c)){
                returnBookCount.put(borrowBook.Book__c,borrowBook.Borrow_Quantity__c);
            }
            else{
                Decimal quantity = returnBookCount.get(borrowBook.Book__c) + borrowBook.Borrow_Quantity__c;
                returnBookCount.put(borrowBook.Book__c,quantity);
            }
        }
        
        for(Id bookId : returnBooks){
            LMS_Books__c book = new LMS_Books__c();
            book.Id = bookId;
            book.Quantity__c = returnBookCount.get(bookId);
            booksToProcess.add(book);
        }
        
        if(!booksToProcess.isEmpty()){
            try{
                update booksToProcess;
            }
            catch(Exception e){
                throw new AuraHandledException(e.getMessage());
            }
        }
        
        for(LMS_Borrowed_Books__c bBook : borrowBookDetails){
            bBook.Actual_Return_Date__c = system.today();
        }
        
        try{
           update borrowBookDetails;
        }
        catch(Exception e){
            throw new AuraHandledException(e.getMessage());
        }
        
    }

}