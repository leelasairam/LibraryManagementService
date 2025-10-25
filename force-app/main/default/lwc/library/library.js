import { LightningElement,track,wire,api } from 'lwc';
import getBooks from '@salesforce/apex/LMSController.getBooks';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class Library extends LightningElement {
    books = [];
    isAdmin = true;
    searchByOptions = [
                { label: 'Book Name', value: 'Book_Name__c' },
                { label: 'Book Id', value: 'Name'},
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
        { label: 'User Id', fieldName: 'Name' },
        { label: 'User Name', fieldName: 'userName' },
        { label: 'Book', fieldName: 'bookName'},
        { label: 'Borrow Quantity', fieldName: 'Borrow_Quantity__c'},
        { label: 'Borrow Date', fieldName: 'Borrow_Date__c'},
        { label: 'Return Date', fieldName: 'Return_Date__c'},
        { label: 'Day(s) Bowrrowed', fieldName: 'daysBorrowed'},
    ];

    connectedCallback(){
        this.fetchBooks(false,null,null);
    }

    toast(title,msg,variant){
        const evt = new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

    fetchBooks(isBookSearch,field,value){
        getBooks({searchField:field,keyWord:value,isSearch:isBookSearch})
        .then(result=>{
            this.books = result;
        })
        .catch(error=>{
            console.log(error);
        })
    }

    handleSearch(){
        const container = this.refs.bookSearch;
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
}