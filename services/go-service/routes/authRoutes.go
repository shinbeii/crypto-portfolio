package routes

import (
	"crypto-folio/controllers"

	"github.com/gorilla/mux"
)

func AuthRoutes(router *mux.Router) {
	router.HandleFunc("/register", controllers.Register).Methods("POST")
	router.HandleFunc("/login", controllers.Login).Methods("POST")
	router.HandleFunc("/logout", controllers.Logout).Methods("POST")
	router.HandleFunc("/verify-session", controllers.VerifySession).Methods("GET")
}
