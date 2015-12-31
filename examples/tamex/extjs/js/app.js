/**
 * @author T. Schmidt
 * 20.06.2011
 */

//Namespace
Ext.namespace('Demo');

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