public class LMSController {
    @AuraEnabled
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
    
    @AuraEnabled 
	public static String createBorrowRequest(Id borrowerId, Decimal quantity, Date returnDate,Id bookId){
        String returnText = '';
        LMS_Books__c bookDetails = [SELECT Id,Name,Book_Name__c,Quantity__c FROM LMS_Books__c WHERE Id = :bookId LIMIT 1];
        String borrowerUID = [SELECT Id,Name FROM LMS_Users__c WHERE Id =:borrowerId LIMIT 1].Name;
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
            BR.Name = borrowerUID.substringAfter('-')+'_'+DateTime.now().formatGMT('yyyyMMddHHmmss');
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
    
    @AuraEnabled
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
        list<LMS_Borrowed_Books__c>borrowBookDetails = [SELECT Id,Name,Book__c,Borrow_Date__c,Borrow_Quantity__c,Borrower__c,Return_Date__c,Actual_Return_Date__c FROM LMS_Borrowed_Books__c WHERE Id IN :borrowIds AND Actual_Return_Date__c=null];
        if(borrowBookDetails.isEmpty()){
            throw new AuraHandledException('Selected row(s) either already retured or not available');
        }
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
        
        booksToProcess = [SELECT Id,Quantity__c FROM LMS_Books__c WHERE Id IN :returnBooks];
        for(LMS_Books__c book : booksToProcess){
            book.Quantity__c += returnBookCount.get(book.Id);
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
    
    @AuraEnabled
    public static list<LMS_Users__c>getUsers(String keyWord){
        Boolean isSearch = (keyWord!=null && keyWord!='');
        list<LMS_Users__c>users = new list<LMS_Users__c>();
        if(isSearch){
            String q;
            Integer keyWordLen = keyWord.length();
            if(keyWordLen>7 && (keyWordLen==10 || keyWordLen==12)){
                q = 'SELECT Id,Name,User_Name__c,Phone__c,Email__c,Govt_Id__c,Active__c FROM LMS_Users__c WHERE Phone__c = \''+keyWord+'\'';
            }
            else{
                q = 'SELECT Id,Name,User_Name__c,Phone__c,Email__c,Govt_Id__c,Active__c FROM LMS_Users__c WHERE NAME LIKE \'%'+keyWord+'%\'';
            }
            users = database.query(q);
        }
        else{
            users = [SELECT Id,Name,User_Name__c,Phone__c,Email__c,Govt_Id__c,Active__c FROM LMS_Users__c Order By LastModifiedDate DESC LIMIT 20];
        }
        return users;
    }
    
    @AuraEnabled(cacheable=true)
    public static map<string,list<string>> getFields(String objectApiName){
        map<string,list<string>>fieldsToReturn = new map<string,list<string>>();
        set<string>sobjectsList = new set<string>();
        
        if(objectApiName == 'LMS_Borrowed_Books__c'){
            sobjectsList.add(objectApiName);
            sobjectsList.add('LMS_Books__c');
            sobjectsList.add('LMS_Users__c');
        }
        else{
            sobjectsList.add(objectApiName);
        }
        
        for(string obj : sobjectsList){
            Schema.SObjectType objType = Schema.getGlobalDescribe().get(obj);
            String objectLabel = objType.getDescribe().getLabel();
    		Schema.DescribeSObjectResult describe = objType.getDescribe();
            Map<String, Schema.SObjectField> fields = describe.fields.getMap();
            for (String apiName : fields.keySet()) {
                Schema.DescribeFieldResult fld = fields.get(apiName).getDescribe();
                if(obj == objectApiName){
                    fieldsToReturn.put(apiName, new list<String>{fld.getLabel(),String.valueof(fld.getType())});
                    if(apiName == 'OwnerId' || apiName == 'CreatedById' || apiName == 'LastModifiedById'){
                        fieldsToReturn.put(apiName.replace('id','.name'), new list<String>{fld.getLabel()+'> Name',String.valueof(fld.getType())});
                    }
                }
                else{
                    fieldsToReturn.put(obj.replace('__c','__r.')+apiName,new list<String>{objectLabel+'>'+fld.getLabel(),String.valueof(fld.getType())});
                }
            }
        }
        return fieldsToReturn;
    }
    
    @AuraEnabled
    public static void upsertLMSReport(LMSReportWrapper report,Id rptId){
        LMS_Reports__c rpt = new LMS_Reports__c();
        rpt.Query__c = report.query;
        rpt.Custom_Logic__c = report.customLogic;
        rpt.Display_Fields__c = report.displayFields;
        rpt.Filters__c = report.filters;
        rpt.Object__c = report.ObjectName;
        rpt.Report_Name__c = report.reportName;
        rpt.Sorting_Order__c = report.sortOrder;
        rpt.Sort_By__c = report.sortBy;
        if(rptId!=null){
            rpt.Id = rptId;   
        }
        upsert rpt;
    }
    
    public class LMSReportWrapper{
        @AuraEnabled public String filters { get; set; }
        @AuraEnabled public String displayFields { get; set; }
        @AuraEnabled public String ObjectName { get; set; }
        @AuraEnabled public String customLogic { get; set; }
        @AuraEnabled public String  query{ get; set; }
        @AuraEnabled public String sortBy { get; set; }
        @AuraEnabled public String sortOrder { get; set; }
        @AuraEnabled public String reportName { get; set; }
    }
}