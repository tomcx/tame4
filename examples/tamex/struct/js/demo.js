/**
 *  @author T.Schmidt, 31.10.2011
 *  Example using structures with TAME.
 */

//A global variable as namespace
var Demo = {
    dataIn: {},
    dataOut: {}
};


window.onload = function(){

    //Button for sending values to the PLC, can be a local variable.
    //50ms after writing the function for reading is called.
    var button1 = document.getElementById("button1");
    
    var structdef = {
        var_1: 'BYTE',
        var_2: 'REAL.2',
        var_3: 'SINT',
        var_4: 'TIME.#h',
        var_5: 'ARRAY.5.STRING.6', //Array of 5 strings with 6 chars
        var_6: 'INT1DP'
    };

    button1.onclick = function(){
        Demo.dataOut.var_1 = document.getElementById("input1").value;
        Demo.dataOut.var_2 = document.getElementById("input2").value;
        Demo.dataOut.var_3 = document.getElementById("input3").value;
        Demo.dataOut.var_4 = document.getElementById("input4").value;
        Demo.dataOut.var_5 = [];
        for (var i = 0; i < 5; i++) {
            Demo.dataOut.var_5[i] = document.getElementById("input5" + i).value;
        }
        Demo.dataOut.var_6 = document.getElementById("input6").value;
        
        Plc.writeStruct({
            name: '.TestStruct',
            val: Demo.dataOut,
            def: structdef,
            oc: Demo.readStructure,
            ocd: 50
        });
    };

    Demo.readStructure = function(){
        Plc.readStruct({
            name: '.TestStruct',
            def: structdef,
            jvar: 'Demo.dataIn',
            oc: function() {
                document.getElementById("show1").firstChild.data = Demo.dataIn.var_1;
                document.getElementById("show2").firstChild.data = Demo.dataIn.var_2;
                document.getElementById("show3").firstChild.data = Demo.dataIn.var_3;
                document.getElementById("show4").firstChild.data = Demo.dataIn.var_4;
                for (var i = 0; i < 5; i++) {
                    document.getElementById("show5" + i).firstChild.data = Demo.dataIn.var_5[i];
                }
                document.getElementById("show6").firstChild.data = Demo.dataIn.var_6;
            }
        });
    };
};


