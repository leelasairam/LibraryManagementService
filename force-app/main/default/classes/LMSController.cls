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

}