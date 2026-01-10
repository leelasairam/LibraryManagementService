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
        { label: 'Greater then', value: '>' },
        { label: 'Less then', value: '<' }
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
        this.filterCounterList = [...this.filterCounterList,{Id:++this.filterCounter,Field:'',Operation:'',Value:'',dataType:'STRING',inpType:'text',placeholderTxt:'Enter value',operationsList:[]}];
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
                    let opList = [];
                    switch(fieldDataType){
                        case 'BOOLEAN':
                            placeholderText = "Enter TRUE or FALSE";
                            htmlInpType = 'checkbox';
                            opList = [{ label: 'Equal', value: '=' }];
                            break;
                        case 'DATETIME':
                            htmlInpType = 'datetime';
                            placeholderText = '';
                            opList = [{ label: 'Equal', value: '=' },{ label: 'Not Equal', value: '!=' },{ label: 'Greater then', value: '>' },{ label: 'Less then', value: '<' }];
                            break;
                        case 'DATE':
                            htmlInpType = 'date';
                            placeholderText = '';
                            opList = [{ label: 'Equal', value: '=' },{ label: 'Not Equal', value: '!=' },{ label: 'Greater then', value: '>' },{ label: 'Less then', value: '<' }];
                            break;
                        case 'DOUBLE':
                        case 'PERCENT':
                            htmlInpType = 'number';
                            opList = [{ label: 'Equal', value: '=' },{ label: 'Not Equal', value: '!=' },{ label: 'Greater then', value: '>' },{ label: 'Less then', value: '<' }];
                            break;
                        case 'URL':
                            htmlInpType = 'url';
                            opList = [{ label: 'Equal', value: '=' },{ label: 'Not Equal', value: '!=' },{ label: 'Contains', value: 'LIKE' }];
                            break;
                        case 'EMAIL':
                            htmlInpType = 'email';
                            opList = [{ label: 'Equal', value: '=' },{ label: 'Not Equal', value: '!=' },{ label: 'Contains', value: 'LIKE' }];
                            break;
                        case 'PHONE':
                            htmlInpType = 'tel';
                            opList = [{ label: 'Equal', value: '=' },{ label: 'Not Equal', value: '!=' }];
                            break;
                        case 'TIME':
                            htmlInpType = 'time';
                            placeholderText = '';
                            opList = [{ label: 'Equal', value: '=' },{ label: 'Not Equal', value: '!=' },{ label: 'Greater then', value: '>' },{ label: 'Less then', value: '<' }];
                            break;
                        default:
                            htmlInpType = 'text';
                            opList = [{ label: 'Equal', value: '=' },{ label: 'Not Equal', value: '!=' },{ label: 'Contains', value: 'LIKE' }];
                    }
                    return { ...row, [inputType]: value,Value:'',dataType : fieldDataType, inpType : htmlInpType, placeholderTxt : placeholderText,operationsList:opList,Operation:null};
                }
                return { ...row, [inputType]: value };
            }
            return row;
        })
        console.log(JSON.stringify(this.filterCounterList));
    }

    removeRow(event){
        if(this.filterCounterList.length<=1){
            this.toast('Error','You cannot remove. Atleast one row should be there.','error');
            return;
        }
        const Id = event.target.dataset.id;
        this.filterCounterList = this.filterCounterList.filter(i=>i.Id!=Id);
        this.filterCounterList = this.filterCounterList.map((item,index)=>({...item,Id:index+1}));
        this.filterCounter = this.filterCounterList.length;
        console.log(JSON.stringify(this.filterCounterList));
    }

    processSelectedFields(event){
        this.displayFields = event.detail.value;
    }

    generateLogic(){
        const filterRowSize = this.filterCounterList.length;
        let generalLogic = '';
        this.filterCounterList.forEach((fr,index)=>{
            generalLogic += fr.Id;
            if(++index<filterRowSize){
                generalLogic += ' AND ';
            }
        })
        return generalLogic;
    }

    queryValidation(reportName,plainLogic,logicNumArray){
        let msg = '';
        let valid = true;
        if(reportName == '' || reportName==null){
            valid = false;
            msg = 'Please provide report name';
        }
        if(this.displayFields == '' || this.displayFields == null){
            valid = false;
            msg = 'Please select atleast one field to display';
        }
        if(this.filterCounterList.length === 1 && (this.filterCounterList[0].Operation==null || this.filterCounterList[0].Operation=='' || this.filterCounterList[0].Field==null || this.filterCounterList[0].Field==null)){
            valid = false;
            msg = 'Please add atleast one filter row';
        }
        if(plainLogic){
            const logicRegex = /^\s*\(*\s*\d+(?:\s+(?:AND|OR)\s+\(*\s*\d+\s*\)*)*\s*$/i;
            const isValidLogic = logicRegex.test(plainLogic);
            if(!isValidLogic){
                valid = false;
                msg = "Please enter valid Custom Logic. Only number, space, 'AND', 'OR' are allowed. Custom Logic should be in following pattren '1 AND (2 OR 3)' or '1 AND 2'";
            }
        }
        if(this.filterCounterList){
            this.filterCounterList.forEach(row=>{
                if(row.Field == '' || row.Operation == '' || row.Field == null || row.Operation == null){
                    valid = false;
                    msg = 'Field and Operation cannot be blank for any filter row. If filter row not needed, please remove';
                }
                if(!logicNumArray.includes(Number(row.Id))){
                    valid = false;
                    msg = 'Please enter all row ids in custom logic';
                }
            })
        }

        return {ok:valid,message:msg};
    }

    subsituteCustomLogic(){
        let query = '';
        const reportName = this.template.querySelector('.reportName').value;
        const container = this.refs.customFilterOrderby;
        let logic = container.querySelector('.cLogic').value || this.generateLogic(); //1 AND (2 OR 3)
        const plainLogic = logic;
        const sortbyField = container.querySelector('.sortBy').value;
        const sortOrder = container.querySelector('.sortOrder').value;
        console.log(logic);
        const logicStrArray = logic.match(/\d+/g) || [];
        const logicNumArray = logicStrArray.map(n=>(Number(n)));
        const isValid = this.queryValidation(reportName,plainLogic,logicNumArray);
        if(!isValid.ok){
            this.toast('Error',isValid.message,'error');
            return;
        }
        /*logicNumArray.forEach(i=>{
            const filterRowStr = this.getfilterRowStr(i);
            if(filterRowStr=='error'){
                return;
            }
            // replace ONLY the exact number (not partial matches)
            const regex = new RegExp(`\\b${i}\\b`, 'g');
            logic = logic.replace(regex,filterRowStr);
        })*/
        for(const i of logicNumArray){
            const filterRowStr = this.getfilterRowStr(i);
            if(filterRowStr=='error'){
                return;
            }
            // replace ONLY the exact number (not partial matches)
            const regex = new RegExp(`\\b${i}\\b`, 'g');
            logic = logic.replace(regex,filterRowStr);
        }

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
            this.toast('Error','Enter available row number in custom logic','error');
            return 'error';
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