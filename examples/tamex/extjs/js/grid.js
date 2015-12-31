/**
 * @author T. Schmidt
 * 28.10.2011
 */

Ext.namespace('Demo.grid.window');

//Create Window
Demo.grid.createWindow = function(){
    if (! Demo.grid.window.rendered || Demo.grid.window.isDestroyed) { 
        Demo.grid.window = Ext.create('Ext.window.Window', {
            title: 'Example of a Grid',
            layout: 'fit',
            items: Demo.grid.createFormPanel()
        }).show();
    }
    Demo.grid.readData();
};

//Define the array and the store for storing data
Demo.grid.data = new Array(20);
(function() {
    for (var i=0;i<20;i++) {
        Demo.grid.data[i] = {plcString: 'No Data'};
    }
})();

Demo.grid.dataIndex = 0;

Ext.create('Ext.data.Store', {
    storeId:'gridstore',
    fields:[
        {name: 'plcString', type: 'string'},
        {name: 'plcReal', type: 'float'},
        {name: 'plcInt', type: 'int'},
        {name: 'plcByte', type: 'int'},
        {name: 'checkbox', type: 'boolean'},
        {name: 'plcBool0', type: 'boolean'},
        {name: 'plcBool1', type: 'boolean'},
        {name: 'plcBool2', type: 'boolean'},
        {name: 'plcBool3', type: 'boolean'},
        {name: 'plcBool4', type: 'boolean'}
    ],
    data: Demo.grid.data,
    proxy: {
        type: 'memory',
        reader: {
            type: 'json',
            root: 'items'
        }
    }
});

//Define the data structure for the request
Demo.grid.teststruct = {
    plcString: 'STRING.10',
    plcReal: 'REAL.2',
    plcInt: 'INT',
    plcByte: 'BYTE',
    checkbox: 'BOOL',
    plcBool: 'ARRAY.5.BOOL.SP'  //Add the array items as single properties to the data object
};


//The functions for sending/reading data
Demo.grid.readData = function() {
    Plc.readArrayOfStruct({
        name: '.ArrayTestStruct3',
        oc: function() {
            Ext.data.StoreManager.lookup('gridstore').load();
        },
        def: Demo.grid.teststruct,
        jvar: 'Demo.grid.data'
    });
};

Demo.grid.sendData = function() {
    Demo.grid.data[Demo.grid.dataIndex] = Demo.grid.window.getComponent('grid_formpanel').getForm().getFieldValues();
    Plc.writeArrayOfStruct({
        name: '.ArrayTestStruct3',
        def: Demo.grid.teststruct,
        item: Demo.grid.dataIndex,
        val: Demo.grid.data,
        oc: Demo.grid.readData,
        ocd: 50
    });
};

//Create the panel with grid and form
Demo.grid.createFormPanel = function() {

    return Ext.create('Ext.form.Panel', {
        id: 'grid_formpanel',
        width: 850,
        bodyPadding: 5,
        fieldDefaults: {
            labelAlign: 'left'
        },
        layout: 'column',
        items: [{
            columnWidth: 0.4,
            xtype: 'gridpanel',
            id: 'demo_gridpanel',
            invalidateScrollerOnRefresh: false,
            store: Ext.data.StoreManager.lookup('gridstore'),
            height: 400,
            columnLines: true,
            columns: [{
                    text: 'STRING',
                    flex: 1,
                    dataIndex: 'plcString'
                },{
                    text : 'REAL',
                    width: 70,
                    dataIndex: 'plcReal'
                },{
                    text: 'INT',
                    width: 70,
                    dataIndex: 'plcInt'
                },{
                    text: 'BYTE',
                    width: 50,
                    dataIndex: 'plcByte'
                }
            ],
            listeners: {
                selectionchange: function(model, records) {
                    var selModel = this.getSelectionModel();
                    var store = this.getStore();
                    Demo.grid.dataIndex = store.indexOf(selModel.getLastSelected());
                    if (records[0]) {
                        this.up('form').getForm().loadRecord(records[0]);
                    }
                }
            }
        },{
            xtype: 'panel',
            columnWidth: 0.6,
            height: 400,
            items: [{
                xtype: 'displayfield',
                value: 'By clicking the submit button the values in the form \
                are sent to the PLC using the </br> "item"-option. 50ms later \
                a read request fetches the complete array and updates </br> the grid. \
                The array of boolean variables is not shown in the grid.',
                margin: '5 5 10 10'
            },{
                xtype: 'fieldset',
                margin: '5 5 5 5',
                title: 'Values',
                defaults: {
                    labelWidth: 60
                },
                items: [{
                    xtype: 'textfield',
                    name: 'plcString',
                    fieldLabel: 'STRING'
                },{
                    xtype: 'numberfield',
                    name: 'plcReal',
                    fieldLabel: 'REAL',
                    value: 0,
                    minValue: -100000,
                    maxValue: 100000,
                    step: 0.1,
                    width: 130               
                },{
                    xtype: 'numberfield',
                    name: 'plcInt',
                    fieldLabel: 'INT',
                    value: 0,
                    minValue: -32768,
                    maxValue: 32767,
                    width: 130               
                },{
                    xtype: 'slider',
                    name: 'plcByte',
                    fieldLabel: 'BYTE',
                    margin: '20 0 0 0',
                    value: 0,
                    minValue: 0,
                    maxValue: 254,
                    width: 450
                }]
            },{
                xtype: 'fieldset',
                defaults: {
                    labelWidth: 60,
                    value: 0,
                    minValue: 0,
                    maxValue: 254,
                    width: 450
                },
                margin: '20 0 0 0',
                title: 'Array of BOOL',
                checkboxToggle:true,
                checkboxName: 'checkbox',
                collapsed: true,
                items: [{
                    xtype: 'checkboxfield',
                    name: 'plcBool0',
                    fieldLabel: 'BOOL',
                    inputValue: '1'
                },{
                    xtype: 'checkboxfield',
                    name: 'plcBool1',
                    fieldLabel: 'BOOL',
                    inputValue: '1'
                },{
                    xtype: 'checkboxfield',
                    name: 'plcBool2',
                    fieldLabel: 'BOOL',
                    inputValue: '1'
                },{
                    xtype: 'checkboxfield',
                    name: 'plcBool3',
                    fieldLabel: 'BOOL',
                    inputValue: '1'
                },{
                    xtype: 'checkboxfield',
                    name: 'plcBool4',
                    fieldLabel: 'BOOL',
                    inputValue: '1'
                }]
            }]
        }],
        buttons: [
        '->',
        {
            text: 'Submit',
            tooltip: 'Send the values in the form to the PLC.',
            handler: Demo.grid.sendData
        },{ 
            xtype: 'button',
            text: 'Reload',
            tooltip: 'Reload data from PLC.',
            handler: Demo.grid.readData
        }]
    });
};



