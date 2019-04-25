import { IGQLType, IGQLField } from "prisma-datamodel";
import { InternalBaseEntity } from "./entity";
import { Constructor } from "./type-helpers";
import { writeFileSync } from "fs";
import { EOL } from "os";
import * as glob from "glob";
import { flatMap } from "./utils";
import * as path from "path";

type CustomEntities = Record<
  string,
  {
    path: string;
    entityClass: Constructor<InternalBaseEntity<string>>;
  }
>;

const DMtoTSTypes: Record<string, string> = {
  String: "string",
  ID: "string",
  DateTime: "string"
};

export function codegen(
  datamodelTypes: IGQLType[],
  globs: string[],
  clientAbsolutePath: string
) {
  const outputPath = path.join(__dirname, "../src/generated.ts");
  const customEntitiesWithPath = findCustomEntities(globs);
  const entitiesName = datamodelTypes.map(m => m.name);
  const rendered = renderCodegen(
    datamodelTypes,
    customEntitiesWithPath,
    entitiesName,
    clientAbsolutePath,
    outputPath
  );

  writeFileSync(outputPath, rendered);
}

function renderCodegen(
  datamodelTypes: IGQLType[],
  customEntitiesWithPath: CustomEntities,
  entitiesName: string[],
  absoluteClientPath: string,
  outputPath: string
) {
  return `\
  import {
    Repository,
    BaseEntity,
    BaseEntities,
    CustomEntities
  } from "../lib";
  import { PrismaClient } from "${getImportPathRelativeToOutput(
    absoluteClientPath,
    outputPath
  )}"
  ${Object.keys(customEntitiesWithPath)
    .map(
      className =>
        `import { ${className} as ${getCustomEntityName(
          customEntitiesWithPath[className].entityClass,
          entitiesName
        )} } from "${getImportPathRelativeToOutput(
          customEntitiesWithPath[className].path,
          outputPath
        )}"`
    )
    .join(";" + EOL)}

declare global {
  interface PrismaEntity {
    models: {
${datamodelTypes.map(m => `      ${m.name}: ${getEntityName(m)};`).join(EOL)}
    }
    repositories: {
${datamodelTypes
  .map(m => `      ${m.name}: ${getRepositoryName(m)};`)
  .join(EOL)}
    }
    selects: {
${datamodelTypes.map(m => `      ${m.name}: ${getSelectName(m)};`).join(EOL)}
    }
    baseEntities: ${datamodelTypes.map(m => getEntityName(m)).join(" | ")}
    customEntities: ${Object.keys(customEntitiesWithPath)
      .map(key =>
        getCustomEntityName(
          customEntitiesWithPath[key].entityClass,
          entitiesName
        )
      )
      .join(" | ")}
  }
}

${datamodelTypes
  .map(m => renderEntity(m, customEntitiesWithPath, entitiesName))
  .join(EOL)}
${datamodelTypes
  .map(m => renderRepository(m, customEntitiesWithPath, entitiesName))
  .join(EOL)}
export const entities: {
  baseEntities: BaseEntities
  customEntities: CustomEntities
} = {
  baseEntities: [${datamodelTypes.map(m => getEntityName(m)).join(", ")}],
  customEntities: [
    ${Object.keys(customEntitiesWithPath)
      .map(
        className =>
          `require("${getImportPathRelativeToOutput(
            customEntitiesWithPath[className].path,
            outputPath
          )}").${className}`
      )
      .join("," + EOL)}
  ]
}
`;
}

function renderEntity(
  model: IGQLType,
  customEntities: CustomEntities,
  entitiesName: string[]
) {
  return `\
export class ${getEntityName(model)} extends BaseEntity<"${model.name}"> {
  static modelName = "${model.name}";

  constructor(protected input: ${getConstructorInputName(model)}) {
    super();

${model.fields.map(f => `    ${renderEntityFieldSetter(f)}`).join(EOL)}
  }

${model.fields
  .map(f => `  ${renderEntityFieldDefinition(f, customEntities, entitiesName)}`)
  .join(EOL)}
}

${renderInput(model, customEntities, entitiesName)}

${renderSelectInterface(model)}
`;
}

function renderInput(
  model: IGQLType,
  customEntities: CustomEntities,
  entitiesName: string[]
) {
  return `\
export interface ${getConstructorInputName(model)} {
${model.fields
  .map(f => `  ${renderEntityFieldDefinition(f, customEntities, entitiesName)}`)
  .join(EOL)}
}`;
}

function renderSelectInterface(model: IGQLType) {
  return `\
export interface ${getSelectName(model)} {
${model.fields
  .filter(f => typeof f.type !== "string")
  .map(f => `  ${f.name}?: boolean | ${getSelectName(f.type as IGQLType)}`)
  .join(";" + EOL)}
}`;
}

function renderSelectFieldDefinition(fields: IGQLField[]) {
  return;
}

function renderRepository(
  model: IGQLType,
  customEntities: CustomEntities,
  entitiesName: string[]
) {
  return `\
export class ${getRepositoryName(model)} extends Repository<${referenceEntity(
    model,
    customEntities,
    entitiesName
  )}, PrismaClient> {
  static modelName = "${model.name}";
}
`;
}

function renderEntityFieldSetter(field: IGQLField) {
  return `this.${field.name} = input.${field.name};`;
}

function renderEntityFieldDefinition(
  field: IGQLField,
  customEntities: CustomEntities,
  entitiesName: string[]
) {
  if (typeof field.type === "string") {
    return `${field.name}: ${DMtoTSTypes[field.type]};`;
  }

  const entityName =
    customEntities[field.type.name] !== undefined
      ? getCustomEntityName(
          customEntities[field.type.name].entityClass,
          entitiesName
        )
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

function getCustomEntityName(
  entityClass: Constructor<any>,
  entitiesNames: string[]
) {
  const customEntityName = entityClass.name;

  if (entitiesNames.includes(customEntityName)) {
    return `Extended${customEntityName}`;
  }

  return customEntityName;
}

function referenceEntity(
  model: IGQLType,
  customEntities: CustomEntities,
  entitiesNames: string[]
) {
  if (customEntities[model.name]) {
    return getCustomEntityName(
      customEntities[model.name].entityClass,
      entitiesNames
    );
  }

  return getEntityName(model);
}

function getRepositoryName(model: IGQLType) {
  return `${model.name}BaseRepository`;
}

function getSelectName(model: IGQLType) {
  return `${model.name}Select`;
}

export function getImportPathRelativeToOutput(
  importPath: string,
  outputDir: string
): string {
  let relativePath = path.relative(path.dirname(outputDir), importPath);

  if (!relativePath.startsWith(".")) {
    relativePath = "./" + relativePath;
  }

  // remove .ts or .js file extension
  relativePath = relativePath.replace(/\.(ts|js)$/, "");

  // remove /index
  relativePath = relativePath.replace(/\/index$/, "");

  // replace \ with /
  relativePath = relativePath.replace(/\\/g, "/");

  return relativePath;
}

function findCustomEntities(globs: string[]) {
  return flatMap(globs, g => glob.sync(g)).reduce<
    Record<string, { path: string; className: string; entityClass: any }>
  >((acc, entityPath) => {
    const mod = require(entityPath);
    const keys = Object.keys(mod).filter(
      key => mod[key].modelName !== undefined
    );
    console.log(entityPath);

    keys.forEach(key => {
      acc[key] = { className: key, path: entityPath, entityClass: mod[key] };
    });

    return acc;
  }, {});
}
