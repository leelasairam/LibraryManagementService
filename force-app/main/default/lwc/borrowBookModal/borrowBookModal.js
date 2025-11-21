import { api,track } from 'lwc';
import LightningModal from 'lightning/modal';
import createBorrowRequest from '@salesforce/apex/LMSController.createBorrowRequest';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';
export default class BorrowBookModal extends LightningModal {
    @api params;
    modalLoad = false;

    handleClose() {
        this.close('close');
    }

    toast(title,msg,variant){
        const evt = new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

    borrowerLookupFilter = {
        criteria: [
            {
                fieldPath: 'Active__c',
                operator: 'eq',
                value: true,
            },
            {
                fieldPath: 'Phone__c',
                operator: 'ne',
                value: null,
            },
        ],
        filterLogic: '1 AND 2',
    };

    borrowerLookupDisplayInfo = {
        primaryField: 'User_Name__c',
        additionalFields: ['Name'],
    };

    borrowerLookupMatchingInfo = {
        primaryField: { fieldPath: 'User_Name__c', mode: 'startsWith' },
        additionalFields: [{ fieldPath: 'Name' }],
    };

    async saveBorrowBook(){
        const container = this.refs.borrowForm;
        const returnDate = container.querySelector('.form-returndate').value;
        const quantity = container.querySelector('.form-quantity').value;
        const borrowerUID = container.querySelector('.form-borroweruid').value;

        if(borrowerUID && quantity && returnDate){
            this.modalLoad = true;
            await createBorrowRequest({borrowerId:borrowerUID,quantity:quantity,returnDate:returnDate,bookId:this.params.Id})
            .then(res1=>{
                //Response '' indicates success of DML
                if(res1===''){
                    this.toast('Success','Book borrowed successfully','success');
                    this.close('success');
                }
                else{
                    this.toast('Error',res1,'error');
                }
                
            })
            .catch(error=>{
                console.log(error);
                this.toast('Error',error.body.message,'error');
            })
            .finally(()=>{
                this.modalLoad = false;
            })
        }
        else{
            this.toast('Error','Please enter valid values for all required fields','error');
        }

    }
}
