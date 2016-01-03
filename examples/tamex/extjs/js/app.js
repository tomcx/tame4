/**
 * @author T. Schmidt
 * 03.01.2016
 */

//Namespace
Ext.namespace('Demo');

//Function for starting the client. Defined in "webservice.js"
//in the "resources" directory. 
window.onload = startClient;


//This function is called if client is ready (on-ready-function).
//See "webservice.js" in the "resources" directory. 
function loadExample() {
    //Anwendung starten
    Ext.application({
        name: 'TAME Demo with Ext JS 4',
        launch: function() {         
            Ext.create('Ext.container.Viewport', {
                layout: 'auto',
                items: [{
                    html: '<h1 class="x-panel-header">TAME Demo with Ext JS 4</h1>',
                    //autoHeight: true,
                    border: false,
                    margins: '20 20 20 0'
                },{
                    xtype: 'toolbar',
                    items: [{
                        // xtype: 'button', // default for Toolbars
                        text: 'Grid',
                        handler: Demo.grid.createWindow
                    },{
                        text: 'Form',
                        handler: Demo.form.createWindow
                    },{
                        text: 'Chart',
                        handler: Demo.chart.createWindow
                    },{
                        text: 'Gauge',
                        handler: Demo.gauge.createWindow
                    }]
                }]
            });
        }
    });
}
