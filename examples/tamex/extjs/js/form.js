/**
 * @author T. Schmidt
 * 28.10.2011
 */

Ext.namespace('Demo.form.window');

//Create Window
Demo.form.createWindow = function(){
    if (! Demo.form.window.rendered || Demo.form.window.isDestroyed) { 
        Demo.form.window = Ext.create('Ext.window.Window', {
            title: 'Example of a Form',
            layout: 'fit',
            items: Demo.form.createFormPanel()
        }).show();
    }
    Demo.form.readData();
};

//Define the object and the store for storing data
Demo.form.data = {};

//Define the data structure for the request
Demo.form.teststruct = {
    plcReal: 'REAL.2',
    plcTime: 'TIME.#s',
    plcTod: 'TOD',
    plcDate: 'DATE',
    plcString: 'ARRAY.5.STRING.6.SP'  //Add the array items as single properties to the data object
};

Demo.form.readData = function() {
    Plc.readStruct({
        name: '.TestStruct4',
        oc: function(){
            Demo.form.window.getComponent('formpanel').getForm().setValues(Demo.form.data);
        },
        def: Demo.form.teststruct,
        jvar: 'Demo.form.data'
    });
};

Demo.form.sendData = function() {
    Demo.form.data = Demo.form.window.getComponent('formpanel').getForm().getFieldValues();
    Plc.writeStruct({
        name: '.TestStruct4',
        def: Demo.form.teststruct,
        val: Demo.form.data,
        oc: Demo.form.readData,
        ocd: 50
    });
};

//Create the panel with form and form
Demo.form.createFormPanel = function() {

    return Ext.create('Ext.form.Panel', {
        id: 'formpanel',
        frame: false,
        width: 340,
        bodyPadding: 5,
        fieldDefaults: {
            labelAlign: 'left',
            labelWidth: 200,
            anchor: '100%'
        },
        items: [{
            xtype: 'displayfield',
            value: 'By clicking the submit button the values in the form \
            are sent to the PLC. 50ms later a read request fetches the values\
            from the PLC and updates the form.',
            margin: '5 5 10 10'
        },{
            xtype: 'fieldset',
            margin: '5 5 5 5',
            title: 'Values',
            defaults: {
                labelWidth: 60
            },
            items: [{
                xtype: 'numberfield',
                name: 'plcReal',
                fieldLabel: 'REAL',
                value: 0,
                minValue: -100000,
                maxValue: 100000,
                step: 0.5,
                width: 130               
            },{
                xtype: 'numberfield',
                name: 'plcTime',
                fieldLabel: 'TIME/s',
                value: 0,
                minValue: 0,
                maxValue: 1000,
                width: 130
            },{
                xtype: 'timefield',
                name: 'plcTod',
                fieldLabel: 'TOD',
                format: 'H:i'
            },{
                xtype: 'datefield',
                name: 'plcDate',   
                fieldLabel: 'DATE',
                value: new Date(),
                maxValue: new Date(),  // limited to the current date or prior
                format: 'd.m.Y'
            }]
        },{
            xtype: 'fieldset',
            margin: '5 5 5 5',
            title: 'Array of STRING',
            defaults: {
                labelWidth: 60
            },
            items: [{
                xtype: 'textfield',
                name: 'plcString0',
                fieldLabel: 'STRING'
            },{
                xtype: 'textfield',
                name: 'plcString1',
                fieldLabel: 'STRING'
            },{
                xtype: 'textfield',
                name: 'plcString2',
                fieldLabel: 'STRING'
            },{
                xtype: 'textfield',
                name: 'plcString3',
                fieldLabel: 'STRING'
            },{
                xtype: 'textfield',
                name: 'plcString4',
                fieldLabel: 'STRING'
            }]
        }],
        buttons: [
        '->',
        {
            text: 'Submit',
            tooltip: 'Send the values in the form to the PLC.',
            handler: Demo.form.sendData
        },{ 
            xtype: 'button',
            text: 'Reload',
            tooltip: 'Reload data from PLC.',
            handler: Demo.form.readData
        }]
    });
};



