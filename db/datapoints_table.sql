create table datapoints
(
    sk                                           bigserial primary key,
    oid                                          varchar(64)                            not null,
    owner                                        varchar(64)                            not null,
    created                                      timestamp with time zone default now() not null,
    modified                                     timestamp with time zone default now() not null,
    effective                                    timestamp with time zone               not null,
    timezone                                     varchar(64)                            not null,
    timeoffset                                   integer                                not null,
    schema_namespace                             varchar(32)                            not null,
    schema_name                                  varchar(32)                            not null,
    schema_version_major                         integer                                not null,
    schema_version_minor                         integer                                not null,
    schema_version_patch                         integer                  default 0     not null,
    acquisitionprovenance_sourcename             varchar(32)                            not null,
    acquisitionprovenance_sourcecreationdatetime timestamp with time zone               not null,
    acquisitionprovenance_modality               varchar(100)                           not null,
    additionalproperties                         json                                   not null,
    body                                         json                                   not null
);
