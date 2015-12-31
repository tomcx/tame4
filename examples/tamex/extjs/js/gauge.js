/**
 * @author T. Schmidt
 * 28.10.2011
 */

Ext.namespace('Demo.gauge.window');

//Define the array and the store for storing data
Demo.gauge.data = [{
    gdata: 50
}];

Ext.create('Ext.data.Store', {
    storeId:'gaugestore',
    fields:['gdata'],
    data: Demo.gauge.data,
    proxy: {
        type: 'memory',
        reader: {
            type: 'json',
            root: 'items'
        }
    }
});

//Create Window
Demo.gauge.createWindow = function(){
    if (! Demo.gauge.window.rendered || Demo.gauge.window.isDestroyed) { 
        Demo.gauge.window = Ext.create('Ext.window.Window', {
            width: 500,
            height: 300,
            maximizable: true,
            layout: 'fit',
            title: 'Example of a Gauge',
            items: [{
                xtype: 'chart',
                style: 'background:#fff',
                animate: {
                    //easing: 'bounceOut',
                    //duration: 500
                },
                store: Ext.data.StoreManager.lookup('gaugestore'),
                insetPadding: 25,
                flex: 1,
                axes: [{
                    type: 'gauge',
                    position: 'gauge',
                    minimum: -100,  //Why is this 0?
                    maximum: 100,
                    //steps: 10,
                    margin: 7
                }],
                series: [{
                    type: 'gauge',
                    field: 'gdata',
                    donut: 80,
                    colorSet: ['#3AA8CB', '#ddd']
                }]
            }]
        }).show();
    }

    var interval = window.setInterval(
        function(){
            Plc.readInt({
                name: 'MAIN.Ramp2',
                oc: function(){
                    Ext.data.StoreManager.lookup('gaugestore').load();
                },
                jvar: 'Demo.gauge.data[0].gdata'
            });
        },
        1000
    );
    
    Demo.gauge.window.on(
        'beforedestroy',
        function(){
            window.clearInterval(interval);
        }  
    );
    
};






