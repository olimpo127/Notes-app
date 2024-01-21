from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime



db = SQLAlchemy()

class Note(db.Model):
    __tablename__ = 'note'
    id = db.Column(db.Integer, primary_key=True)
    note = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    archived = db.Column(db.Boolean, nullable=True, default=False)


    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    user = relationship("User", back_populates="notes")

    def serialize(self):
        return {
            "id": self.id,
            "note": self.note,
            "category": self.category,
            "archived": self.archived,
            "user_id": self.user_id, 
        }

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, unique=True)
    email = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)

    notes = relationship("Note", back_populates="user")

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def serialize(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "password": self.password,
        }

