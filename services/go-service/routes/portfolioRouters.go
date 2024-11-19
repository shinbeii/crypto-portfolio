package routes

import (
	"crypto-folio/controllers"

	"github.com/gorilla/mux"
)

func PortfolioRoutes(router *mux.Router) {
	router.HandleFunc("/portfolio", controllers.GetPortfolio).Methods("GET")
	router.HandleFunc("/dashboard", controllers.GetPortfolioData).Methods("GET")
}
