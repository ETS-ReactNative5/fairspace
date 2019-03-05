import shutil

from tempfile import NamedTemporaryFile
from tornado import web

from notebook.services.contents.largefilemanager import LargeFileManager


class AtomicLargeFileManager(LargeFileManager):
    """Handle large file upload atomically."""

    def save(self, model, path=''):
        """Save the file model and return the model with no content."""
        chunk = model.get('chunk', None)
        if chunk is not None:
            path = path.strip('/')

            if 'type' not in model:
                raise web.HTTPError(400, u'No file type provided')
            if model['type'] != 'file':
                raise web.HTTPError(400, u'File type "{}" is not supported for large file transfer'.format(model['type']))
            if 'content' not in model and model['type'] != 'directory':
                raise web.HTTPError(400, u'No file content provided')

            temp_file = NamedTemporaryFile(delete=False)
            temp_path = temp_file.name
            temp_file.close()

            try:
                if chunk == 1:
                    self.log.debug("Saving %s", path)
                    self.run_pre_save_hook(model=model, path=path)
                    super(LargeFileManager, self)._save_file(temp_path, model['content'], model.get('format'))
                else:
                    self._save_large_file(temp_path, model['content'], model.get('format'))
            except web.HTTPError:
                raise
            except Exception as e:
                self.log.error(u'Error while saving file: %s %s', path, e, exc_info=True)
                raise web.HTTPError(500, u'Unexpected error while saving file: %s %s' % (path, e))

            model = self.get(path, content=False)

            # Last chunk
            if chunk == -1:
                os_path = self._get_os_path(path)
                try:
                    shutil.move(temp_path, os_path)
                except Exception as e:
                    self.log.error("Error moving an uploaded file from %s to %s", temp_path, os_path, exc_info=True)
                    raise web.HTTPError(500, u'Unexpected error while moving an uploaded file to its destination: %s' % e)

                self.run_post_save_hook(model=model, os_path=os_path)
            return model
        else:
            return super(LargeFileManager, self).save(model, path)
