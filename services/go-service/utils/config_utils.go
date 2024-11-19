package utils

import (
	"log"

	"github.com/joho/godotenv"
)

// LoadEnv loads the environment variables from the .env file
func LoadEnv() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: Could not load .env file")
	} else {
		log.Println(".env file loaded successfully")
	}
}
