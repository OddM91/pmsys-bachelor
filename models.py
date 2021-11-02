from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSON

db = SQLAlchemy()

class Pmsys_model(db.Model):
    __tablename__ = 'datapoints'
    
    sk = db.Column(db.Integer, primary_key=True)
    oid = db.Column(db.String())
    owner = db.Column(db.String())
    created = db.Column(db.String())    # Timestamp, format "2021-05-01 09:48:59.077896+00"
    modified = db.Column(db.String())   # Timestamp
    effective = db.Column(db.String())  # Timestamp
    timezone = db.Column(db.String())
    timeoffset = db.Column(db.Integer())
    schema_namespace = db.Column(db.String())
    schema_name = db.Column(db.String())
    schema_version_major = db.Column(db.Integer())
    schema_version_minor = db.Column(db.Integer())
    schema_version_patch = db.Column(db.Integer())
    acquisitionprovenance_sourcename = db.Column(db.String())
    acquisitionprovenance_sourcecreationdatetime = db.Column(db.String())
    acquisitionprovenance_modality = db.Column(db.String())
    additionalproperties = db.Column(JSON)
    body = db.Column(JSON)

    def __init__(self, sk, oid, owner, created, modified, effective, timezone, timeoffset, schema_namespace, schema_name, schema_version_major, schema_version_minor, schema_version_patch, acquisitionprovenance_sourcename, acquisitionprovenance_sourcecreationdatetime, acquisitionprovenance_modality, additionalproperties, body):
        self.sk = sk
        self.oid = oid
        self.owner = owner
        self.created = created
        self.modified = modified
        self.effective = effective
        self.timezone = timezone
        self.timeoffset = timeoffset
        self.schema_namespace = schema_namespace
        self.schema_name = schema_name
        self.schema_version_major = schema_version_major
        self.schema_version_minor = schema_version_minor
        self.schema_version_patch = schema_version_patch
        self.acquisitionprovenance_sourcename = acquisitionprovenance_sourcename
        self.acquisitionprovenance_sourcecreationdatetime = acquisitionprovenance_sourcecreationdatetime
        self.acquisitionprovenance_modality = acquisitionprovenance_modality
        self.additionalproperties = additionalproperties
        self.body = body

        def __repr__(self):
            return '<id {}>'.format(self.id)