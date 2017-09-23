frontLight.onclick = function(){
    Plc.writeBool({name: '.In_Bool1', val: !bfrontLight, ocd: 50});
}

frontWindow.onclick = function(){
    boolArray[0] = !boolArray[0];
    Plc.writeArrayOfBool({name: '.ArrayOfBool',item : 0, val: boolArray, ocd: 50});
}

backWindow.onclick = function(){
    boolArray[1] = !boolArray[1];
    Plc.writeArrayOfBool({name: '.ArrayOfBool',item : 1, val: boolArray, ocd: 50});
}

backWheel.onclick = function(){
    boolArray[2] = !boolArray[2];
    Plc.writeArrayOfBool({name: '.ArrayOfBool',item : 2, val: boolArray, ocd: 50});
}

frontWheel.onclick = function(){
    boolArray[2] = !boolArray[2];
    Plc.writeArrayOfBool({name: '.ArrayOfBool',item : 2, val: boolArray, ocd: 50});
}


carBody.onclick = function(){
    vex.dialog.open({
        message: 'Car variables:',
        input: [
            'Carspeed 0.1 - 10s <input id="carSpeedSP" name="carSpeedSP" type="number" step="0.1" min=0.1 max=10 placeholder="Carspeed 0.1 - 10s" />'
        ].join(''),
        buttons: [
            $.extend({}, vex.dialog.buttons.YES, { text: 'Write' }),
            $.extend({}, vex.dialog.buttons.NO, { text: 'Cancel' })
        ],
        afterOpen: function () {
            prmFan1SP = document.getElementById('carSpeedSP');
            Plc.readReal({name: '.In_REAL', jvar: "carSpeedSP.value", oc: function(){carSpeedSP.value=Number(carSpeedSP.value).toFixed(1);} });
        },
        callback: function (data) {
            if (!data.carSpeedSP) {
                console.log('Cancelled')
            } else {
                Plc.writeReal({name: '.In_REAL', val: data.carSpeedSP});
                console.log('carSpeedSP', data.carSpeedSP,)
            }
        }
    })
}