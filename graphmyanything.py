from flask import Flask, render_template, request
from flask_sqlalchemy import SQLAlchemy
import hashlib
import random
from db import User

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/getmyanything.db'
db = SQLAlchemy(app)

@app.route('/')
def landingPage():
	return render_template('landing.html')

@app.route('/account', methods=['POST'])
def account():
	if request.method == 'POST':
		#TODO: check if number exists in database and return if account exists (got to login form with forgot psw)

		#TODO: add number(HASH) to tbl.user
		userNumber = request.form['mobilenumber'].replace("-", "")
		hashNumber = hashlib.sha512(str.encode(userNumber))
		type(hashNumber)

		pin = random.randint(999, 9999)

		#create obj for DB and add to DB
		user = User(hashNumber, pin)

		db.session.add(user)
		db.session.commit()


		print (hashNumber)
		# hex_dig = hash_object.hexdigest()
		# print(hex_dig)

		#TODO: validate number for a valid mobile number (also should be on client side)
		#TODO: create RAND pin
		#TODO: send welcome to Graph My Anything to mobile number with CONFIRMATION request
		#TODO: if confirmed, send Login URL and PIN (for later)
		#TODO: send message to create first Graph (easy)
		#TODO: back and forth for graph details
		#TODO: URL for user to see dashboard - hash of number
		return 'something'
	return 'something'



if __name__ == '__main__':
	db.create_all()
	app.run(debug=True)
