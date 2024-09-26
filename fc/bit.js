function bit_check(num, bit) {
    return (num >> bit) % 2 != 0;
}

function bit_set(num, bit) {
    return num | (1 << bit);
}

function bit_clear(num, bit) {
    return num & ~(1 << bit);
}

module.exports = {
  bit_check,
  bit_set,
  bit_clear
}
