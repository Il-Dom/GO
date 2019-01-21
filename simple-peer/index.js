
  var Peer = require('simple-peer')
  var peer = new Peer({
    initiator: location.hash === '#init',
    trickle: false,
  })
  peer.on('signal', function (data) {
    document.getElementById('yourId').value = JSON.stringify(data)
  })

  document.getElementById('connect').addEventListener('click', function () {
    var otherId = JSON.parse(document.getElementById('otherId').value)
    peer.signal(otherId)
  })

  document.getElementById('send').addEventListener('click', function () {

    // ====================== per la text area ===================================
    var yourMessage = document.getElementById('yourMessage').value
    peer.send(yourMessage)
    document.getElementById('yourMessage').value = ""

    var messagebox = document.getElementById('textbox')
    // Now create and append to iDiv
    var innerDiv = document.createElement('div')
    innerDiv.className = 'clear'
    innerDiv.textContent += yourMessage
    messagebox.appendChild(innerDiv)
  })

  peer.on('data', function (data) {
    var messagebox = document.getElementById('textbox')
    var innerDiv = document.createElement('div')
    innerDiv.className = 'darker'
    innerDiv.textContent += data
    messagebox.appendChild(innerDiv)
  })
  
  
  peer.on('connect', function () {
    console.log('CONNECT')
    var toDelete = document.getElementById('connection-param')
    while (toDelete.firstChild) {
      toDelete.removeChild(toDelete.firstChild);
    }
  })


