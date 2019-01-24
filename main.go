package main

import (
	"fmt"
	"log"
	"net/http"
    "encoding/json"
    "io/ioutil"
)


type peer struct{
    Id string
}

var peerIds = make([]peer, 0)

//handler for http request
func handler(w http.ResponseWriter, r *http.Request) {
        
    w.Header().Set("Access-Control-Allow-Origin", "*") // usually, this line is enough, but you can add the following options.
    w.Header().Set("Access-Control-Allow-Credentials", "true")
    w.Header().Set("Access-Control-Allow-Methods", "OPTIONS, GET, POST")
    w.Header().Set("Access-Control-Allow-Headers", "*")

	switch r.Method {

	case "GET":        
        fmt.Println("Ricevuto una richiesta")
        fmt.Println("sending data back")
        jsonMsg,_ := json.Marshal(peerIds)
        fmt.Fprintf(w, "%s", jsonMsg)
        

    case "POST":
        fmt.Println("Ricevuto una richiesta post")
		/*
         aggiungo l'id del peer allo slice
        */
        b, err := ioutil.ReadAll(r.Body)
        
        defer r.Body.Close()
        if err != nil {
            http.Error(w, err.Error(), 500)
            return
        }

        // Unmarshal
        var msgRcv peer
        err = json.Unmarshal(b, &msgRcv)
        if err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        fmt.Println("Received " + msgRcv.Id + "from POST request")
        peerIds = append(peerIds,msgRcv)
        
        fmt.Fprintf(w, "%s", "200 OK")
        
        
	default:
		fmt.Fprintf(w, "Sorry only POST and GET method allow")
	}

}


func printSlice(s []string) {
	fmt.Printf("len=%d %v\n", len(s), s)
}

func main() {

	http.HandleFunc("/GO", handler)
	log.Fatal(http.ListenAndServe(":8899", nil))
}
