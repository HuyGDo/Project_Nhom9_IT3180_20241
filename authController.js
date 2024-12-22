const createToken = (id) => {
    return jwt.sign({ id }, "bussin cookin secret", {
        expiresIn: maxAge,
    });
}; 