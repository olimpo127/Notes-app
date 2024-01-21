from flask import Flask, request, jsonify
from models import db, Note, User, datetime
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt, generate_password_hash, check_password_hash
from flask_cors import CORS 
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from datetime import timedelta

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'secret-key'
# Set whatever time i like "hours" for hours, "minutes".
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
jwt = JWTManager(app)
db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

CORS(app)
# -----------------------------------JWT----------------------------------------------------------

# LOGIN
@app.route("/login", methods=["POST"])
def login():
    email = request.json.get("email")
    password = request.json.get("password")
    user = User.query.filter_by(email=email).first()
    if user is not None:
        is_valid = check_password_hash(user.password, password)
        if is_valid:
            access_token = create_access_token(identity=email)

            print("Generated Token:", access_token)

            return jsonify({
                "token": access_token,
                "user_id": user.id,
                "email": user.email,
            }), 200
        else:
            return jsonify("Password incorrect"), 400
    else:
        return jsonify("User does not exist, or invalid credentials"), 400


@app.route('/verify_token', methods=['POST'])
@jwt_required()
def verify_token():
    return jsonify(message='Token is valid'), 200

# ------------------------------------#USERS---------------------------------------------------------


@app.route("/users", methods=["POST"])
def create_user():
    username = request.json.get("username")
    email = request.json.get("email")
    password = request.json.get("password")
    password_hash = generate_password_hash(password)
    password = password_hash

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify("El correo ya existe en la base de datos"), 400

    # Crea un nuevo objeto User
    new_user = User(username=username, email=email, password=password)

    db.session.add(new_user)
    db.session.commit()

    return jsonify("User created"), 201


@app.route("/users/list", methods=["GET"])
def get_users():
    users = User.query.all()
    result = []
    for user in users:
        result.append(user.serialize())
    return jsonify(result)


@app.route("/users/<int:id>", methods=["GET"])
def get_user(id):
    user = User.query.get(id)
    if user is not None:
        return jsonify({
            "username": user.username,
            "email": user.email,
            "password": user.password,
        })
    else:
        return jsonify({"message": f"User with ID {id} not found."}), 404


@app.route("/users/<int:id>", methods=["PUT", "DELETE"])
def update_user(id):
    user = User.query.get(id)
    if user is not None:
        if request.method == "DELETE":
            db.session.delete(user)
            db.session.commit()
            return jsonify("Deleted"), 204
        else:
            user.username = request.json.get("username")
            user.email = request.json.get("email")

            # Hash the password if it's provided in the request
            new_password = request.json.get("password")
            if new_password:
                password_hash = generate_password_hash(new_password)
                user.password = password_hash

            db.session.commit()
            return jsonify("User updated"), 200

    return jsonify("User not found"), 418


# ---------NOTES--------------------------------------------------------------------


@app.route("/notes", methods=["POST"])
@jwt_required()
def create_note():
    user_id = get_jwt_identity()
    user = User.query.filter_by(email=user_id).first()
    note = Note()
    note.note = request.json.get("note")
    note.category = request.json.get("category")
    note.archived = request.json.get("archived")
    note.user_id = user.id

    db.session.add(note)
    db.session.commit()

    return "Note created!"

@app.route("/notes/list", methods=["GET"])
def get_notes():
    notes = Note.query.all()
    result = []
    for note in notes:
        testvariable = note.serialize()
        if isinstance(testvariable["user_id"], int):
            user = User.query.get(testvariable["user_id"])
            testvariable["user_id"] = user.email
        result.append(testvariable)
    return jsonify(result)

@app.route("/notes/by_email/<string:email>", methods=["GET"])
def get_notes_by_email(email):
    user = User.query.filter_by(email=email).first()

    if user is not None:
        print("User ID:", user.id)  

        notes = Note.query.filter_by(user_id=user.id).all()
        
        if notes:
            result = [post.serialize() for post in notes]
            print("Notes:", result)  
            return jsonify(result), 200
        else:
            print("No notes found for the user.")  
            return jsonify({"message": "No notes found for the user."}), 200
    else:
        return jsonify({"message": f"User with email {email} not found."}), 404



@app.route("/notes/<int:id>", methods=["GET"])
def get_note(id):
    note = Note.query.get(id)
    if note is not None:
        return jsonify(note.serialize())
    else:
        return jsonify({"message": f"Note with ID {id} not found."}), 404
    


@app.route("/notes/<int:id>", methods=["PUT", "DELETE"])
def update_note(id):
    note = Note.query.get(id)
    if note is not None:
        if request.method == "DELETE":
            db.session.delete(note)
            db.session.commit()
            return jsonify("Deleted"), 204
        else:
            note.note = request.json.get("note")
            note.category = request.json.get("category")
            note.archived = request.json.get("archived") 
            note.user_id = request.json.get("user_id")
            db.session.commit()
            return jsonify("Note updated"), 200

    return jsonify("Note not found"), 418


#------------------------------------PROFILE----------------------------------------------

@app.route("/profile/", methods=["GET"])
@jwt_required()
def get_user_profile():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()
    
    if user is not None:
        user_data = {
            "username": user.username,
            "email": user.email,
            "notes": [note.serialize() for note in user.notes],
        }
        return jsonify(user_data), 200
    else:
        return jsonify({"message": "User not found"}), 404

    

@app.route("/profile/<string:email>", methods=["GET"])
def get_user_profile_by_email(email):
    user = User.query.filter_by(email=email).first()
    
    if user is not None:
        return jsonify({
            "username": user.username,
            "email": user.email
        }), 200
    else:
        return jsonify({"message": "User not found"}, 404)
    
#--------------------------INIT-------------------------------------------------

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(host="localhost", port="5000", debug=True)