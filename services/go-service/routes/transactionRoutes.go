package routes

import (
	"crypto-folio/controllers"

	"github.com/gorilla/mux"
)

func TransactionRoutes(router *mux.Router) {
	router.HandleFunc("/transactions", controllers.GetTransactions).Methods("GET")
	router.HandleFunc("/add-transaction", controllers.AddTransaction).Methods("POST")
	router.HandleFunc("/update-transaction/{id}", controllers.UpdateTransaction).Methods("PUT")
}
