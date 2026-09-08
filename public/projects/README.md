# Project images

Project imagery is discovered automatically.

For any project, create a folder whose name exactly matches the project's `id`:

`public/projects/<project-id>/`

Then add image files such as:

- `hero.jpg` — optional featured image; shown first
- `01.jpg`
- `02.jpg`
- `03.jpg`
- `04.jpg`

Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`.

You do not need to edit a TypeScript data file when adding images. The project page automatically discovers the images in the folder, orders `hero` first, and displays them in the gallery/lightbox.

Only use images you have permission to publish and label images accurately. Do not use generated or stock imagery as if it were a real photograph of the project.
