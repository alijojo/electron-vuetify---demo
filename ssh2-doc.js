{
  appendFile: function (path, data, options, callback_)

  chmod: function (path, mode, cb)

  chown: function (path, uid, gid, cb)

  close: function (handle, cb)

  createReadStream: function (path, options)

  createWriteStream: function (path, options)

  end: function ()

  exists: function (path, cb)

  ext_openssh_fstatvfs: function (handle, cb)

  ext_openssh_fsync: function (handle, cb)

  ext_openssh_hardlink: function (oldPath, newPath, cb)

  ext_openssh_rename: function (oldPath, newPath, cb)

  ext_openssh_statvfs: function (path, cb)

  fastGet: function (remotePath, localPath, opts, cb)

  fastPut: function (localPath, remotePath, opts, cb)

  fchmod: function (handle, mode, cb)

  fchown: function (handle, uid, gid, cb)

  fsetstat: function (handle, attrs, cb)

  fstat: function (handle, cb)

  futimes: function (handle, atime, mtime, cb)

  lstat: function (path, cb)

  mkdir: function (path, attrs, cb)

  open: function (path, flags, attrs, cb)

  opendir: function (path, cb)

  read: function (handle, buf, off, len, position, cb)

  readFile: function (path, options, callback_)

  readdir: function (where, opts, cb)

  readlink: function (path, cb)

  realpath: function (path, cb)

  rename: function (oldPath, newPath, cb)

  rmdir: function (path, cb)

  setstat: function (path, attrs, cb)

  stat: function (path, cb)

  symlink: function (targetPath, linkPath, cb)

  unlink: function (filename, cb)

  utimes: function (path, atime, mtime, cb)

  write: function (handle, buf, off, len, position, cb)

  writeFile: function (path, data, options, callback_)
}