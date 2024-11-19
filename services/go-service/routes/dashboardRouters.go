package routes

import (
	"crypto-folio/controllers"

	"github.com/gorilla/mux"
)

func DashboardRoutes(router *mux.Router) {
	router.HandleFunc("/watchlist", controllers.GetWatchlist).Methods("GET")
	router.HandleFunc("/watchlist", controllers.UpdateWatchlist).Methods("POST")

}
