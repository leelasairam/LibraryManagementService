import { LightningElement,track } from 'lwc';
import getBooks from '@salesforce/apex/LMSController.getBooks';
import getBorrowedBooks from '@salesforce/apex/LMSController.getBorrowedBooks';
import getUsers from '@salesforce/apex/LMSController.getUsers';
import returnBook from '@salesforce/apex/LMSController.returnBook';
import {getOverDueDays} from './libraryHelper';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import BorrowBookModal from 'c/borrowBookModal';
import lmsNewOrEditReport from 'c/lmsNewOrEditReport';
export default class Library extends LightningElement {
    @track books = [];
    @track borrowedBooks = [];
    @track lmsUsers = [];
    isAdmin = true;
    @track activeTab = 'Home'; 
    load = false;
    isBookFormLoaded = false;
    searchByOptions = [
                { label: 'Book Id', value: 'Name'},
                { label: 'Book Name', value: 'Book_Name__c' },
                { label: 'Author', value: 'Author__c' },
    ];
    booksColumns = [
        { label: 'Book Id', fieldName: 'Name' },
        { label: 'Name', fieldName: 'Book_Name__c'},
        { label: 'Author', fieldName: 'Author__c'},
        { label: 'Quantity', fieldName: 'Quantity__c'},
        { label: 'Description', fieldName: 'Description__c'},
    ];

    borrowedBooksColumns = [
        { label: 'Order Id', fieldName: 'Id' },
        { label: 'User Name', fieldName: 'userName' },
        { label: 'Book', fieldName: 'bookName'},
        { label: 'Borrow Quantity', fieldName: 'Borrow_Quantity__c'},
        { label: 'Borrow Date', fieldName: 'Borrow_Date__c'},
        { label: 'Return Date', fieldName: 'Return_Date__c'},
        { label: 'Over Due Day(s)', fieldName: 'overDueDays'},
    ];

    userMngColumns = [
        { label: 'User Id', fieldName: 'Name' },
        { label: 'Name', fieldName: 'User_Name__c' },
        { label: 'Phone', fieldName: 'Phone__c'},
        { label: 'Email', fieldName: 'Email__c'},
        { label: 'Govt Id', fieldName: 'Govt_Id__c'},
    ]

    /*connectedCallback(){
        this.fetchBooks(false,null,null);
    }*/

    toast(title,msg,variant){
        const evt = new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

    handleTabsets(event){
        this.activeTab = event.target.value;
        if(this.activeTab === 'Home'){
            this.fetchBooks(false,null,null);
        }
        else if(this.activeTab === 'Borrowed'){
            this.fetchBorrowedBooks();
        }
        else if(this.activeTab === 'Add New Book'){
            if(!this.isBookFormLoaded){
                this.load = true;
            }
        }
        else if(this.activeTab === 'User Management'){
            this.fetchUsers(null);
        }
        else if(this.activeTab === 'Quick Reports'){
            
        }
    }

    fetchBooks(isBookSearch,field,value){
        this.load = true;
        getBooks({searchField:field,keyWord:value,isSearch:isBookSearch})
        .then(result=>{
            this.books = result;
        })
        .catch(error=>{
            console.log(error);
        })
        .finally(()=>{
            this.load = false;
        })
    }

    handleSearch(){
        const container = this.refs.homeTab;
        const field = container.querySelector('.search-field').value;
        const value = container.querySelector('.search-value').value;
        if(field && value){
            this.fetchBooks(true,field,value);
        }
        else{
            console.log('Please fill the values');
            this.toast('Error','Please fill the values','error');
        }
    }

    resetResult(){
        this.fetchBooks(false,null,null);
    }

    handleBookFormReset() {
        const container = this.refs.bookForm;
        const inputFields = container.querySelectorAll('lightning-input-field');
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
    }

    handleBookFormLoad(){
        this.load = false;
        this.isBookFormLoaded = true;
    }

    handleBookFormSuccess(event){
        const bookId = event.detail.id;
        this.toast('Success',`Book ${bookId} created successfully`,'success');
        this.handleBookFormReset();
        const scrollOptions = {
            left: 0,
            top: 0,
            behavior: 'smooth'
        }
        window.scrollTo(scrollOptions);
    }

    async handleBorrowBookModal() {
        const container = this.refs.homeTab;
        const selectedRecords =  container.querySelector("lightning-datatable").getSelectedRows();
        //console.log(selectedRecords.length, JSON.stringify(selectedRecords));
        if(selectedRecords.length > 0 && selectedRecords.length === 1){
            const record = selectedRecords[0];
            const result = await BorrowBookModal.open({
                size: 'medium',
                title: 'Borrow Book',
                params : record,
            });
            if(result === 'success'){
                this.fetchBooks(false,null,null);
            }
            console.log(result);
        }
        else{
            this.toast('Error','Please select one row','error');
        }
    }

    async fetchBorrowedBooks(){
        this.load = true;
        await getBorrowedBooks({keyWord : null,isSearch:false})
        .then(result=>{
            this.borrowedBooks = result.map(book => ({...book,userName:book.Borrower__r.User_Name__c,bookName:book.Book__r.Book_Name__c,overDueDays:getOverDueDays(book.Return_Date__c)}));
        })
        .catch(error=>{
            this.toast('Error',error,'error');
        })
        .finally(()=>{
            this.load = false;
        })
    }

    /*getOverDueDays(returnDate){
        const today = new Date();
        const otherDate = new Date(returnDate);

        today.setHours(0, 0, 0, 0);
        otherDate.setHours(0, 0, 0, 0);

        const differenceInMs = otherDate.getTime() - today.getTime();

        const msInADay = 1000 * 60 * 60 * 24;
        const daysDifference = Math.floor(differenceInMs / msInADay);
        if(daysDifference>=0){
            return 0;
        }
        else{
            return Number(daysDifference.toString().replace("-", ""));
        }
    }*/

    processRuturn(){
        const container = this.refs.borrowedBooksTab;
        const selectedRecords =  container.querySelector("lightning-datatable").getSelectedRows();
        if(selectedRecords.length>0){
            this.load = true;
            const selectedRecordIds = selectedRecords.map(rec=>(rec.Id));
            console.log(JSON.stringify(selectedRecordIds));
            returnBook({borrowIds:selectedRecordIds})
            .then(result=>{
                this.toast('Success','Returned successfully','success');
            })
            .catch(error=>{
                console.log(error);
                this.toast('Error',error.body.message,'error');
            })
            .finally(()=>{
                this.load = false;
                this.fetchBorrowedBooks();
            })
        }
        else{
            this.toast('Error','Please select atleast one row','error');
        }
    }

    searchUser(){
        const container = this.refs.userManagementTab;
        const keyWord = container.querySelector('.u-search-value').value;
        const keyWordLen = keyWord.length;
        if(keyWord=='' && keyWordLen == 0){
            this.fetchUsers(null);
        }
        else{
            if(keyWordLen>0 && (keyWordLen == 5 || keyWordLen == 7 || keyWordLen == 10 || keyWordLen == 12)){
                this.fetchUsers(keyWord);
            }
            else{
                this.toast('Error','Enter valid User Id or Phone Number','error');
            }
        }
    }

    fetchUsers(searchTerm){
        this.load = true;
        getUsers({keyWord:searchTerm})
        .then(result=>{
            this.lmsUsers = result;
        })
        .catch(error=>{
            console.log(error);
        })
        .finally(()=>{
            this.load = false;
        })
    }

    async modifyReportModal(event){
        const btn = event.target.name;
        const isNewModal = btn == 'New' ? true : false;
        const result = await lmsNewOrEditReport.open({
            size: 'medium',
            title: isNewModal ? 'New Report' : 'Edit Report',
            reportId : isNewModal ? null : null,
            isNew : isNewModal ? true : false,
        });
        if(result === 'success'){
            
        }
        console.log(result);
    }
}