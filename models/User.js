const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sequelize = require("../config/connection");

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Use your 32-byte key

function encryptData(data) {
    if (!data) return data; // Handle null/undefined cases
    const iv = crypto.randomBytes(16); // Ensure IV is 16 bytes
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data.toString(), 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted; // Store IV and encrypted data as a colon-separated string
}

function decryptData(encryptedData) {
    if (!encryptedData) return encryptedData; // Handle null/undefined cases

    if (!encryptedData.includes(':')) {
        throw new Error('Data is not in the correct format for decryption');
    }

    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    if (iv.length !== 16) {
        throw new Error('Invalid IV length: Must be 16 bytes.');
    }

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
}

class User extends Model {
    checkPassword(loginPw) {
        return bcrypt.compareSync(loginPw, this.password);
    }
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: false,
            get() {
                return decryptData(this.getDataValue('first_name'));
            },
            set(value) {
                this.setDataValue('first_name', encryptData(value));
            },
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false,
            get() {
                return decryptData(this.getDataValue('last_name'));
            },
            set(value) {
                this.setDataValue('last_name', encryptData(value));
            },
        },
        dob: {
            type: DataTypes.STRING, // Change to STRING for encrypted data
            allowNull: false,
            get() {
                return decryptData(this.getDataValue('dob'));
            },
            set(value) {
                this.setDataValue('dob', encryptData(value));
            },
        },
        employment: {
            type: DataTypes.STRING,
            allowNull: false,
            get() {
                return decryptData(this.getDataValue('employment'));
            },
            set(value) {
                this.setDataValue('employment', encryptData(value));
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            get() {
                return decryptData(this.getDataValue('email'));
            },
            set(value) {
                this.setDataValue('email', encryptData(value));
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [8],
            },
        },
        income: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const encryptedValue = this.getDataValue('income');
                const decryptedValue = decryptData(encryptedValue);
                return decryptedValue ? parseFloat(decryptedValue) : null; // Ensure it returns as a float
            },
            set(value) {
                this.setDataValue('income', encryptData(value.toString()));
            },

        },
        save: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            get() {
                return decryptData(this.getDataValue('save'));
            },
            set(value) {
                this.setDataValue('save', encryptData(value.toString()));
            },
        },
        debt: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            get() {
                return decryptData(this.getDataValue('debt'));
            },
            set(value) {
                this.setDataValue('debt', encryptData(value.toString()));
            },
        },
        color_theme: {
            type: DataTypes.STRING,
            allowNull: true,
            get() {
                return decryptData(this.getDataValue('color_theme'));
            },
            set(value) {
                this.setDataValue('color_theme', encryptData(value));
            },
        },
    },
    {
        sequelize,
        timestamps: false,
        freezeTableName: true,
        underscored: true,
        modelName: "user",
        hooks: {
            beforeCreate: async (user) => {
                // Validate the email format before encrypting
                if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(decryptData(user.email))) {
                    throw new Error('Validation isEmail on email failed');
                }

                if (user.password && !user.password.startsWith('$2b$')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('email')) {
                    // Validate the email format before encrypting during updates
                    if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(decryptData(user.email))) {
                        throw new Error('Validation isEmail on email failed');
                    }
                }

                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        }

    }
);


module.exports = User;
