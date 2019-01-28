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
        fmt.Println("GET request Received on /GO")
        jsonMsg,_ := json.Marshal(peerIds)
        w.WriteHeader(http.StatusOK)
        fmt.Fprintf(w, "%s", jsonMsg)
        

    case "POST":
		/*
         aggiungo l'id del peer allo slice
        */
        b, err := ioutil.ReadAll(r.Body)
        
        defer r.Body.Close()
        if err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }

        // Unmarshal
        var msgRcv peer
        err = json.Unmarshal(b, &msgRcv)
        if err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        fmt.Println("Received " + msgRcv.Id + " from POST request on /GO")
        peerIds = append(peerIds,msgRcv)
        w.WriteHeader(http.StatusCreated)
        w.Write([]byte("HTTP status code returned!"))
        
        
	default:
        w.WriteHeader(http.StatusNotImplemented )
        w.Write([]byte("HTTP status code returned!"))
	}

}

func handler2(w http.ResponseWriter, r *http.Request) {
    
    w.Header().Set("Access-Control-Allow-Origin", "*") // usually, this line is enough, but you can add the following options.
    w.Header().Set("Access-Control-Allow-Credentials", "true")
    w.Header().Set("Access-Control-Allow-Methods", "OPTIONS, POST")
    w.Header().Set("Access-Control-Allow-Headers", "*")
    
    ischange := false

	switch r.Method {

         case "POST":
            fmt.Println("POST request Received on /removePeer")
            /*
            rimuovo l'id del peer dallo slice
            */
            b, err := ioutil.ReadAll(r.Body)
            
            defer r.Body.Close()
            if err != nil {
                http.Error(w, err.Error(), http.StatusBadRequest)
                return
            }

            // Unmarshal
            var msgRcv peer
            err = json.Unmarshal(b, &msgRcv)
            if err != nil {
                http.Error(w, err.Error(), http.StatusBadRequest)
                return
            }
            fmt.Println("Removing  " + msgRcv.Id + " from peer list")
            
            peerIds, ischange = remove (peerIds,msgRcv)
            
            if ischange ==  true {
                w.WriteHeader(http.StatusOK)
                w.Write([]byte("HTTP status code returned!"))
            }else{
                w.Write([]byte("this is not the peer you are looking for "))
            }
            
            //fmt.Fprintf(w, "%s", "200 OK")
        
        default:
            w.WriteHeader(http.StatusNotImplemented )
            w.Write([]byte("HTTP status code returned!"))
            
        }
        
}

func remove(s []peer, r peer) ([]peer,bool) {
    ischange := false
    for i, v := range s {
        if v == r {
            //fmt.Printf (v.Id + " is equal to " + r.Id)
            //non gli piace sta roba 
            ischange = true;
            return append(s[:i], s[i+1:]...),ischange
        }
    }
    return s,ischange
}

func printSlice(s []string) {
	fmt.Printf("len=%d %v\n", len(s), s)
}




func handler3(w http.ResponseWriter, r *http.Request) {
        
    w.Header().Set("Access-Control-Allow-Origin", "*") // usually, this line is enough, but you can add the following options.
    w.Header().Set("Access-Control-Allow-Credentials", "true")
    w.Header().Set("Access-Control-Allow-Methods", "OPTIONS,POST")
    w.Header().Set("Access-Control-Allow-Headers", "*")

	switch r.Method {


    case "POST":
        fmt.Println("POST request Received on /removeAllPeers")
		/*
         aggiungo l'id del peer allo slice
        */
        b, err := ioutil.ReadAll(r.Body)
        
        defer r.Body.Close()
        if err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        // Unmarshal
        
        var msgRcv peer
        err = json.Unmarshal(b, &msgRcv)
        if err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        
        if msgRcv.Id == "sudo" {
//             //clear peerIds
                fmt.Println("Request OK removing all peers")
        
                peerIds = peerIds[:0]
        }

	default:
        w.WriteHeader(http.StatusNotImplemented )
        w.Write([]byte("HTTP status code returned!"))
	}

}




func main() {

	http.HandleFunc("/GO", handler)
    http.HandleFunc("/removePeer", handler2)
    http.HandleFunc("/removeAllPeers", handler3)
	log.Fatal(http.ListenAndServe(":8899", nil))
}
