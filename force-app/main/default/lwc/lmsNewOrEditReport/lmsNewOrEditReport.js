import { api,track } from 'lwc';
import LightningModal from 'lightning/modal';
import getFields from '@salesforce/apex/LMSController.getFields';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class NewOrEditReport extends LightningModal {
    objectAPINames = [
        { label: 'Books', value: 'LMS_Books__c' },
        { label: 'Borrowed Books', value: 'LMS_Borrowed_Books__c' },
        { label: 'LMS Users', value: 'LMS_Users__c' },
    ];

    @track objFields = [];
    filterCounter = 1;
    @api filterCounterList;
    @api displayFields;
    @api isNew = false;
    operations = [
        { label: 'Equal', value: '=' },
        { label: 'Not Equal', value: '!=' },
        { label: 'Contains', value: 'LIKE' },
    ];

    connectedCallback(){
        if(this.filterCounterList == null || this.filterCounterList == ''){
            this.filterCounterList = [{Id:1,Field:'',Operation:'',Value:''}];
        }
        if(this.displayFields == null || this.displayFields == ''){

        }
    }

    handleClose() {
        this.close('close');
    }

    fetchObjFields(event){
        const obj = event.target.value;
        const fields = [];
        getFields({objectApiName:obj})
        .then(result=>{
            for (const [fieldAPIName, fieldLabel] of Object.entries(result)) {
                fields.push({label:fieldLabel,value:fieldAPIName});
            }
            this.objFields = fields;
        })
        .catch(error=>{
            console.log(error);
        })
    }

    addFilterRow(){
        //this.filterCounterList.push({Id:++this.filterCounter,Field:'',Operation:'',Value:''});
        this.filterCounterList = [...this.filterCounterList,{Id:++this.filterCounter,Field:'',Operation:'',Value:''}];
    }

    handleInpChanges(event){
        const inputType = event.target.name;
        const Id = event.target.dataset.id;
        const value = event.target.value;
        this.filterCounterList = this.filterCounterList.map((row)=>{
            if(row.Id == Id){
                return { ...row, [inputType]: value };
            }
            return row;
        })
        console.log(JSON.stringify(this.filterCounterList));
    }

    removeRow(event){
        const Id = event.target.dataset.id;
        this.filterCounterList = this.filterCounterList.filter(i=>i.Id!=Id);
        console.log(JSON.stringify(this.filterCounterList));
    }
}