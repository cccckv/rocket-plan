#!/bin/bash

DB_PATH="prisma/dev.db"
EMAIL="ccccckv@outlook.com"
AMOUNT=100

# Get user ID and current credits
USER_INFO=$(sqlite3 "$DB_PATH" "SELECT id, credits FROM User WHERE email = '$EMAIL';")

if [ -z "$USER_INFO" ]; then
  echo "Error: User not found"
  exit 1
fi

USER_ID=$(echo "$USER_INFO" | cut -d'|' -f1)
CURRENT_CREDITS=$(echo "$USER_INFO" | cut -d'|' -f2)

echo "User ID: $USER_ID"
echo "Current credits: $CURRENT_CREDITS"

# Calculate new balance
NEW_CREDITS=$(echo "$CURRENT_CREDITS + $AMOUNT" | bc)

# Update credits
sqlite3 "$DB_PATH" "UPDATE User SET credits = $NEW_CREDITS WHERE id = $USER_ID;"

# Create transaction record
sqlite3 "$DB_PATH" "INSERT INTO Transaction (userId, amount, type, createdAt) VALUES ($USER_ID, $AMOUNT, 'admin_adjust', datetime('now'));"

# Verify
FINAL_CREDITS=$(sqlite3 "$DB_PATH" "SELECT credits FROM User WHERE id = $USER_ID;")

echo "New credits: $FINAL_CREDITS"
echo "✅ Successfully added $AMOUNT credits to $EMAIL"
