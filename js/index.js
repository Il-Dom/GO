var urlServer = "http://127.0.0.1:8899"


jQuery.fn.clickToggle = function(a,b) {
  function cb(){ [b,a][this._tog^=1].call(this); }
  return this.on("click", cb);
};

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i <  6; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function sendPOSTtoServer (){	
    if($('#peerId').val() != ''){						
        $.ajax({
            type:'post',
            url: urlServer+"/GO",
            dataType: "text/plain",
            data: JSON.stringify({ "id":  $('#peerId').val() }),
            error: function(a,b,c){
                console.log(a)
            }
        })

        var connectionID = $('#peerId').val()
        sessionStorage.setItem("connectionID",connectionID)
        location.href="game.html"
    }
    else{
        $('#message').css('color','red')
        setTimeout(function(){
            $('#message').css('color','#999')
        },1000)
    }
}	

function setupHandlers(){
    $('#hostgame').css('background-image','url(images/hostgame.svg)')
    $('#playgame').css('background-image','url(images/search.svg)')
    
    $('#infohost').hide()
    $('#infoplayer').hide()

    $('#hostgame').on('click',function(){
        $('#toggle-play').slideToggle("slow",function(){})
        $('#infohost').toggle('slow')
    })
    
    var toggled = false
    $('#playgame').on('click',function(){
        if(!toggled){
            $.ajax({
                type: 'get',
                url: urlServer+"/GO",
                dataType: "json",
                success: function(data){
                    $(data).each(function(i, item){
                        var hostingPlayer = $('<div>'+item.Id+'</div>')
                        hostingPlayer.addClass('gridCell')
                        hostingPlayer.on('click',function(){
                            var connectionID = makeid()
                            sessionStorage.setItem("connectionID",connectionID)
                            sessionStorage.setItem("otherID",item.Id)
                            location.href="game.html"
                        })
                        hostingPlayer.appendTo($('#infoplayer'))
                    })
                    toggled = true
                },
                complete: function(){
                    $('#infoplayer').toggle('slow')
                }
            })
        }
        else{
            toggled = false
            $('#infoplayer').toggle('slow')
            $('#infoplayer').text('')
            
        }
        $('#toggle-host').slideToggle("slow",function(){})
        
        
    })

    $('#createHost').on('click',function(){
        registerPeer()
    })

    $("#peerId").bind("keypress", {}, keypressInBox);	
    
    function keypressInBox(e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) { //Enter keycode                        
            e.preventDefault();
            registerPeer()
        }
    };
}


function registerPeer (){
    var myPeerId = $('#peerId').val() 
    $.ajax({
        type: 'get',
        url: urlServer+"/GO",
        dataType: "json", // return data type
        success: function(data){
            var peerIsOk = true
            
            if (data.length!=0) {
            
                //check if the choosen peer id is in the list
                data.forEach((item) => {
                    Object.entries(item).forEach(([key, val]) => {
                    console.log('entro' + myPeerId +" - item peer - "+ item.Id)
                    if ( myPeerId == item.Id ){
                        console.log("peer uguali")
                    // user must change the peer id
                        peerIsOk = false
                    }
                    });
                });
                
                console.log(peerIsOk)
                // if the choosen peer id is unique then send the post request
                if (peerIsOk == true) {
                    sendPOSTtoServer()
                }
                else{
                    console.log("Ho trovato uno stronzo che prova a chiamarsi come un altro stronzo")
                    $('#message').css('color','red')
                    $("#message").text("Name already registered")
                    setTimeout(function(){
                        $('#message').css('color','#999')
                        $('#message').text( "Insert your name")
                        $('#peerId').val("")
                    },2000)
                }
            } 
            else{
                sendPOSTtoServer()
            }
        }
    })
}

$(document).ready(function(){
    $('#infoplayer').css('display','grid').css( 'grid-template-columns',' auto auto')
    setupHandlers()

});

