/**
 *  @author T.Schmidt, 31.10.2011
 *  Example using an array of structures with TAME.
 */

//A global variable as namespace
var Demo = {
    arrayIn: [],
    arrayOut: []
};


window.onload = function(){

    //Button for sending values to the PLC, can be a local variable.
    //50ms after writing the function for reading is called.
    var button1 = document.getElementById("button1");
    
    var structdef = {
        var_1: 'STRING.5',
        var_2: 'REAL.2',
        var_3: 'SINT',
        var_4: 'INT',
        var_5: 'ARRAY.5.BYTE'
    };

    button1.onclick = function(){
        for (var i = 0; i < 4; i++) {
            Demo.arrayOut[i] = {};
            Demo.arrayOut[i].var_1 = document.getElementById("input1" + i).value;
            Demo.arrayOut[i].var_2 = document.getElementById("input2" + i).value;
            Demo.arrayOut[i].var_3 = document.getElementById("input3" + i).value;
            Demo.arrayOut[i].var_4 = document.getElementById("input4" + i).value;
            Demo.arrayOut[i].var_5 = [];
            for (var j = 0; j < 5; j++) {
                Demo.arrayOut[i].var_5[j] = document.getElementById("input5" + i + j).value;
            }
        }
        
        var item = parseInt((document.getElementById("idx").value), 10);
        
        Plc.writeArrayOfStruct({
            name: '.ArrayOfTestStruct2',
            val: Demo.arrayOut,
            item: item,
            def: structdef,
            oc: Demo.readArray,
            ocd: 50
        });
    };

    Demo.readArray = function(){
        Plc.readArrayOfStruct({
            name: '.ArrayOfTestStruct2',
            def: structdef,
            jvar: 'Demo.arrayIn',
            oc: function() {
                 for (var i = 0; i < 4; i++) {
                    document.getElementById("show1" + i).firstChild.data = Demo.arrayIn[i].var_1;
                    document.getElementById("show2" + i).firstChild.data = Demo.arrayIn[i].var_2;
                    document.getElementById("show3" + i).firstChild.data = Demo.arrayIn[i].var_3;
                    document.getElementById("show4" + i).firstChild.data = Demo.arrayIn[i].var_4;
                    for (var j = 0; j < 5; j++) {
                        document.getElementById("show5" + i + j).firstChild.data = Demo.arrayIn[i].var_5[j];
                    }
                }
            }
        });
    };
};


