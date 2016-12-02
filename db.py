from graphmyanything import db




class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usernumberhash = db.Column(db.String(), unique=True)
    pin = db.Column(db.Integer(4), unique=False)

    def __init__(self, usernumberhash, pin):
        self.usernumberhash = usernumberhash
        self.pin = pin

    def __repr__(self):
        return '<UserNumber Hash %r>' % self.usernumberhash