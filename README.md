# Passwordless Server

## TODO

- [x] basic auth with register and login functionality
- [ ] make all the fido settings configurable
- [?] adding multiple authenticators(devices)
- [ ] login with one time codes
- [ ] tests
- [ ] better errors; more descriptive with error messages so that it can be internationalized
- [ ] make sure that users can register if their registration fails once, currently it gives you an error that the entered email already exists
- [x] `authenticatorUserVerification: 'preferred',` - setting a value prevents warning in chrome
- [ ] rename `register` to `registerDevice` in the frontend library
- [ ] maybe make it possible so that one user (Account) needs to register only once, and then they can just login on any site and they are authenticated?
