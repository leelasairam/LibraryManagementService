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
    @track fieldDataTypeMap = new Map();
    sortOrder = [
        { label: 'Acending', value: 'ASC' },
        { label: 'Decending', value: 'DESC' },
    ]

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
                fields.push({label:fieldLabel[0],value:fieldAPIName});
                this.fieldDataTypeMap.set(fieldAPIName,fieldLabel[1]);//adding data type of field
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
                if(inputType==='Field'){
                    return { ...row, [inputType]: value,dataType : this.fieldDataTypeMap.get(value) };
                }
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

    subsituteCustomLogic(){
        const container = this.refs.customFilterOrderby;
        let logic = container.querySelector('.cLogic').value; //1 AND (2 OR 3)
        const sortbyField = container.querySelector('.sortBy').value;
        const sortOrder = container.querySelector('.sortOrder').value;
        console.log(logic)
        const logicStrArray = logic.match(/\d+/g) || [];
        const logicNumArray = logicStrArray.map(n=>(Number(n)));
        logicNumArray.forEach(i=>{
            const filterRowStr = this.getfilterRowStr(i);
            // replace ONLY the exact number (not partial matches)
            const regex = new RegExp(`\\b${i}\\b`, 'g');
            logic = logic.replace(regex,filterRowStr);
        })
        console.log(logic);
    }

    getfilterRowStr(Id){
        const filterRow = this.filterCounterList.find(row=>row.Id===Id);
        if (!filterRow){
            return '';
        } 
        let filterStr = '';
        let value = this.filterCounterList?.Value;

        switch(this.filterCounterList?.dataType){
            case 'BOOLEAN':
                value = value.toLowerCase();
                break;
            case 'DATETIME':
            case 'DATE':
        }

        if(filterRow.Operation == 'LIKE'){
            filterStr = `${filterRow.Field} ${filterRow.Operation} '%${filterRow.Value}%'`;
        }
        else{
            filterStr = `${filterRow.Field} ${filterRow.Operation} ${filterRow.Value}`;
        }
        return filterStr;
    }
}