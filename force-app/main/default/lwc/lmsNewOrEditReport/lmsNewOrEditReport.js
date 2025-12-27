import { api,track } from 'lwc';
import LightningModal from 'lightning/modal';
import getFields from '@salesforce/apex/LMSController.getFields';
import upsertLMSReport from '@salesforce/apex/LMSController.upsertLMSReport';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class NewOrEditReport extends LightningModal {
    objectAPINames = [
        { label: 'Books', value: 'LMS_Books__c' },
        { label: 'Borrowed Books', value: 'LMS_Borrowed_Books__c' },
        { label: 'LMS Users', value: 'LMS_Users__c' },
    ];

    @track objFields = [];
    filterCounter = 1;
    filterCounterList;
    displayFields;
    @api reportId;
    @api isNew;
    operations = [
        { label: 'Equal', value: '=' },
        { label: 'Not Equal', value: '!=' },
        { label: 'Contains', value: 'LIKE' },
    ];
    obj='';
    @track fieldDataTypeMap = new Map();
    sortOrder = [
        { label: 'Acending', value: 'ASC' },
        { label: 'Decending', value: 'DESC' },
    ]

    connectedCallback(){
        if(this.isNew){
            this.filterCounterList = [{Id:1,Field:'',Operation:'',Value:'',dataType:'STRING',inpType:'text',placeholderTxt:'Enter value'}];
            this.displayFields = '';
        }
        else{

        }
    }

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

    fetchObjFields(event){
        this.obj = event.target.value;
        const fields = [];
        getFields({objectApiName:this.obj})
        .then(result=>{
            console.log(JSON.stringify(result));
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
        this.filterCounterList = [...this.filterCounterList,{Id:++this.filterCounter,Field:'',Operation:'',Value:'',dataType:'STRING',inpType:'text',placeholderTxt:'Enter value'}];
    }

    handleInpChanges(event){
        const inputType = event.target.name;
        const Id = event.target.dataset.id;
        const value = event.target.value || event.target.checked;
        this.filterCounterList = this.filterCounterList.map((row)=>{
            if(row.Id == Id){
                if(inputType==='Field'){
                    const fieldDataType = this.fieldDataTypeMap.get(value);
                    console.log('fieldDataType : ', fieldDataType)
                    let htmlInpType = '';
                    let placeholderText = 'Enter Value';
                    switch(fieldDataType){
                        case 'BOOLEAN':
                            placeholderText = "Enter TRUE or FALSE";
                            htmlInpType = 'checkbox';
                            break;
                        case 'DATETIME':
                            htmlInpType = 'datetime';
                            placeholderText = '';
                            break;
                        case 'DATE':
                            htmlInpType = 'date';
                            placeholderText = '';
                            break;
                        case 'DOUBLE':
                        case 'PERCENT':
                            htmlInpType = 'number';
                            break;
                        case 'URL':
                            htmlInpType = 'url';
                            break;
                        case 'EMAIL':
                            htmlInpType = 'email';
                            break;
                        case 'PHONE':
                            htmlInpType = 'tel';
                            break;
                        case 'TIME':
                            htmlInpType = 'time';
                            placeholderText = '';
                            break;
                        default:
                            htmlInpType = 'text';
                    }
                    return { ...row, [inputType]: value,Value:'',dataType : fieldDataType, inpType : htmlInpType, placeholderTxt : placeholderText};
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

    processSelectedFields(event){
        this.displayFields = event.detail.value;
    }

    subsituteCustomLogic(){
        let query = '';
        const reportName = this.template.querySelector('.reportName').value;
        const container = this.refs.customFilterOrderby;
        let logic = container.querySelector('.cLogic').value; //1 AND (2 OR 3)
        const plainLogic = logic;
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
        query = `SELECT ${this.displayFields} FROM ${this.obj}`;
        if((this.filterCounterList[0].Field != null && this.filterCounterList[0].Field != '') || filterCounterList.length>1){
            query = `SELECT ${this.displayFields} FROM ${this.obj} WHERE ${logic}`;
        }
        if(sortbyField != null && sortbyField != ''){
            query = `SELECT ${this.displayFields} FROM ${this.obj} WHERE ${logic} ORDER BY ${sortbyField} ${(sortOrder!=null && sortOrder!='') ? sortOrder : 'DESC'}`;
        }
        console.log(query);
        const rptWrapperData = {
            filters : JSON.stringify(this.filterCounterList),
            displayFields : this.displayFields?.join(','),
            ObjectName : this.obj,
            customLogic : plainLogic,
            query : query,
            sortBy : sortbyField,
            sortOrder : sortOrder,
            reportName : reportName, 
        }
        console.log(JSON.stringify(rptWrapperData));
        const reportId1 = this.isNew ? null : this.reportId;
        upsertLMSReport({report:rptWrapperData,rptId:reportId1})
        .then(result=>{
            console.log(result);
            this.close('success');
            this.toast('Success','Report created successfully','success');
        })
        .catch(error=>{
            console.log(error);
            this.toast('Error','Something went wrong','error');
        })

    }

    getfilterRowStr(Id){
        const filterRow = this.filterCounterList.find(row=>row.Id===Id);
        if (!filterRow){
            return '';
        } 
        let filterStr = '';
        const operation = filterRow?.Operation;
        let value = filterRow.Value;
        console.log('value-'+ filterRow,value)
        switch(filterRow?.dataType){
            case 'BOOLEAN':
                value = value=='' ? false : value;
                break;
            case 'DATETIME':
            case 'DATE':
            case 'PERCENT':
            case 'INTEGER':
            case 'CURRENCY':
                value = value;
                break;
            default:
                value = `'${value}'`;
        }

        if(operation == 'LIKE'){
            value = `'%${filterRow?.Value}%'`;
            filterStr = `${filterRow.Field} ${filterRow.Operation} ${value}`;
        }
        else{
            filterStr = `${filterRow.Field} ${filterRow.Operation} ${value}`;
        }
        return filterStr;
    }
}