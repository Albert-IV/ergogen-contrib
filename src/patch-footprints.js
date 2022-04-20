const fs = require("fs/promises")
const yargs = require("yargs/yargs")
const { hideBin } = require("yargs/helpers")

const ERGOGEN_DIRECTORY = "node_modules/ergogen"
const ERGOGEN_FOOTPRINTS_DIRECTORY = `${ERGOGEN_DIRECTORY}/src/footprints`
const ERGOGEN_BACKUP_DIRECTORY = `${ERGOGEN_DIRECTORY}/src/.footprints_backup`

const ensureLibraryExists = async (library) => {
  const footprints = await fs.readdir(`node_modules/${library}/src/footprints`)
  if (!footprints.length) {
    throw new Error(`Library ${library} does not have files in their footprints folder`)
  }
}

const ensureLibrariesExist = async (libraries) =>
  Promise.all(libraries.map((library) => ensureLibraryExists(library)))

const getFootprintLibraries = () => {
  // TODO: Add ability to support creating frontend files, echoing the
  // plaintext JS file containing all the footprints merged together.
  const libraries = yargs(hideBin(process.argv)).argv._

  if (!libraries.includes("ergogen"))
    throw new Error("The package `ergogen` must be in the list of footprints to import")

  return libraries
}

const hasBackups = async () => {
  const dirContents = await fs.readdir(ERGOGEN_BACKUP_DIRECTORY)
  if (!dirContents.length) throw new Error("No files in footprints backup folder")
}

const ensureBackup = async () => {
  try {
    await hasBackups()
  } catch (_e) {
    // Footprints directory either didn't exist or doens't have contents
    await fs.mkdir(ERGOGEN_BACKUP_DIRECTORY)
    const files = await fs.readdir(ERGOGEN_FOOTPRINTS_DIRECTORY)

    await Promise.all(
      files.map((file) =>
        fs.copyFile(
          `${ERGOGEN_FOOTPRINTS_DIRECTORY}/${file}`,
          `${ERGOGEN_BACKUP_DIRECTORY}/${file}`
        )
      )
    )
  }
}

const patchLibrary = async (library) => {
  const footprintLocation =
    libary === "ergogen" //
      ? ERGOGEN_BACKUP_DIRECTORY
      : `node_modules/${library}/src/footprints`

  const files = await fs.readdir(footprintLocation)

  return Promise.all(
    files.map((file) =>
      fs.copyFile(`${footprintLocation}/${file}`, `${ERGOGEN_FOOTPRINTS_DIRECTORY}/${file}`)
    )
  )
}

async function* patchLibraries(libraries) {
  for (const library of libraries) {
    yield await patchLibrary(library)
  }
}

const createIndexContents = async () => {
  const footprints = (await fs.readdir(ERGOGEN_FOOTPRINTS_DIRECTORY)).filter(
    (file) => file !== "index.js" && file.match(".js")
  )

  const fileParts = [
    `module.exports = {`,
    ...footprints.map((footprint) => {
      const module = footprint.split(".")[0]
      return `  ${module}: require('./${module}'),`
    }),
    "}",
  ]

  return fileParts.join("\n")
}

const writeIndexFile = async (fileContents) => {
  fs.writeFile(`${ERGOGEN_FOOTPRINTS_DIRECTORY}/index.js`, fileContents)
}

const generateIndex = async () => {
  const fileContents = await createIndexContents()
  await writeIndexFile(fileContents)
}

const patchFootprints = async () => {
  const libraries = getFootprintLibraries()

  await ensureLibrariesExist(libraries)
  await ensureBackup()

  await patchLibraries(libraries)
  await generateIndex()
}

module.exports = patchFootprints
