import { api,track } from 'lwc';
import LightningModal from 'lightning/modal';
import getLMSUserDetails from '@salesforce/apex/LMSController.getLMSUserDetails';
import createBorrowRequest from '@salesforce/apex/LMSController.createBorrowRequest';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';
export default class BorrowBookModal extends LightningModal {
    @api params;
    modalLoad = false;

    handleClose() {
        this.close('done');
    }

    toast(title,msg,variant){
        const evt = new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

    async saveBorrowBook(){
        const container = this.refs.borrowForm;
        const returnDate = container.querySelector('.form-returndate').value;
        const quantity = container.querySelector('.form-quantity').value;
        const borrowerUID = container.querySelector('.form-borroweruid').value;
        let borrowerDetails;

        if(borrowerUID && borrowerUID.length === 5 && quantity && returnDate){
            const UID = `U-${borrowerUID}`;
            this.modalLoad = true;
            await getLMSUserDetails({uid:UID})
            .then(async res => {
                borrowerDetails = res;
                this.modalLoad = false;
                const result = await LightningConfirm.open({
                    message: `${borrowerDetails.User_Name__c}[${borrowerDetails.Name}] \n\n borrowing "${this.params.Book_Name__c}" book of qunatity ${quantity}.`,
                    variant: 'header',
                    label: 'Validate User Deails',
                    theme: 'warning'
                });

                if(result){
                    this.modalLoad = true;
                    await createBorrowRequest({borrowerId:borrowerDetails.Id,borrowerUID:borrowerDetails.Name,quantity:quantity,returnDate:returnDate,bookId:this.params.Id})
                    .then(res1=>{
                        //Response '' indicates success of DML
                        if(res1===''){
                            this.toast('Success','Book borrowed successfully','success');
                            this.close('done');
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
            })
            .catch(error=>{
                console.log(error);
                this.toast('Error',error,'error');
                this.modalLoad = false;
            })
        }
        else{
            this.toast('Error','Please enter valid values for all required fields','error');
        }



    }
}
