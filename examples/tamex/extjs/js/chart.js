/**
 * @author T. Schmidt
 * 28.10.2011
 */

Ext.namespace('Demo.chart.window');

//Define the array and the store for storing data
Demo.chart.data = new Array(10);
(function() {
    for (var i=0;i<10;i++) {
        Demo.chart.data[i] = {graph1: i, graph2: i, xaxis: i};
    }
})();

Ext.create('Ext.data.Store', {
    storeId:'chartstore',
    fields:['graph1', 'graph2', 'xaxis'],
    data: Demo.chart.data,
    proxy: {
        type: 'memory',
        reader: {
            type: 'json',
            root: 'items'
        }
    }
});


//Create Window
Demo.chart.createWindow = function(){
    if (! Demo.chart.window.rendered || Demo.chart.window.isDestroyed) { 
        Demo.chart.window = Ext.create('Ext.window.Window', {
            width: 800,
            height: 400,
            maximizable: true,
            layout: 'fit',
            title: 'Example of a Chart',
            items: [{
                xtype: 'chart',
                style: 'background:#fff',
                store: Ext.data.StoreManager.lookup('chartstore'),
                shadow: false,
                animate: true,
                axes: [{
                    type: 'Numeric',
                    grid: true,
                    minimum: -100,
                    maximum: 100,
                    position: 'left',
                    fields: ['graph1', 'graph2'],
                    title: 'Item Values',
                    grid: true
                },{
                    type: 'Numeric',
                    position: 'bottom',
                    minimum: 1,
                    maximum: 10,
                    fields: ['xaxis'],
                    title: 'Array Items',
                    grid: true
                }],
                series: [{
                    type: 'line',
                    smooth: false,
                    axis: 'left',
                    xField: 'xaxis',
                    yField: 'graph1',
                    markerConfig: {
                        radius: 3,
                        size: 3
                    }
                },{
                    type: 'line',
                    axis: 'left',
                    smooth: false,
                    xField: 'xaxis',
                    yField: 'graph2',
                    markerConfig: {
                        radius: 3,
                        size: 3
                    }
                }]
            }]
        }).show();
    }
    
    //Define the data structure for the request
    var teststruct = {
        graph1: 'INT',
        graph2: 'INT'
    };
    
    var interval = window.setInterval(
        function(){
            Plc.readArrayOfStruct({
                name: '.ArrayChart',
                oc: function(){
                    Ext.data.StoreManager.lookup('chartstore').load();
                },
                def: teststruct,
                jvar: 'Demo.chart.data'
            });
        }, 
        1000
    );
    
    Demo.chart.window.on(
        'beforedestroy',
        function(){
            window.clearInterval(interval);
        }  
    );
    

};






