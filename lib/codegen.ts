import { IGQLType, IGQLField } from "prisma-datamodel";
import { BaseEntity } from "./entity";
import { Constructor } from "./type-helpers";
import { writeFileSync } from "fs";
import { EOL } from "os";

type CustomEntities = Record<string, Constructor<BaseEntity<string>>>;

const DMtoTSTypes: Record<string, string> = {
  String: "string",
  ID: "string",
  DateTime: "string"
};

export function codegen(
  datamodelTypes: IGQLType[],
  customEntities: CustomEntities,
  path: string
) {
  const rendered = `\
${datamodelTypes.map(m => renderEntity(m, customEntities)).join(EOL)}`;

  writeFileSync(path, rendered);
}

function renderEntity(model: IGQLType, customEntities: CustomEntities) {
  return `\
export class ${getEntityName(model)}<Model extends string = "${
    model.name
  }"> extends BaseEntity<Model> {
  static modelName = "${model.name}";

  constructor(protected input: ${getConstructorInputName(model)}) {
    super();
${model.fields.map(f => `    ${renderEntityFieldSetter(f)}`).join(EOL)}
  }

${model.fields
  .map(f => `  ${renderEntityFieldDefinition(f, customEntities)}`)
  .join(EOL)}
}

${renderInput(model, customEntities)}
`;
}

function renderInput(model: IGQLType, customEntities: CustomEntities) {
  return `\
interface ${getConstructorInputName(model)} {
${model.fields
  .map(f => `  ${renderEntityFieldDefinition(f, customEntities)}`)
  .join(EOL)}
}`;
}

function renderEntityFieldSetter(field: IGQLField) {
  return `this.${field.name} = input.${field.name};`;
}

function renderEntityFieldDefinition(
  field: IGQLField,
  customEntities: CustomEntities
) {
  if (typeof field.type === "string") {
    return `${field.name}: ${DMtoTSTypes[field.type]};`;
  }

  const entityName =
    customEntities[field.type.name] !== undefined
      ? customEntities[field.type.name].name
      : getEntityName(field.type);

  if (field.isList) {
    return `${field.name}: () => Promise<${entityName}[]>;`;
  }

  return `${field.name}: () => Promise<${entityName}>;`;
}

function getConstructorInputName(model: IGQLType) {
  return `${model.name}Input`;
}

function getEntityName(model: IGQLType) {
  return model.name;
}
