pub fn mr_u64<R: FnMut(u64, &mut [u8])>(rd: &mut R, addr: u64) -> u64 {
    let mut b = [0u8; 8];
    rd(addr, &mut b);
    u64::from_le_bytes(b)
}

pub fn mr_read_pointer<R: FnMut(u64, &mut [u8])>(rd: &mut R, addr: u64) -> u64 {
    let mut b = [0u8; 8];
    rd(addr, &mut b[..6]);
    u64::from_le_bytes(b)
}

pub fn mr_read_u16<R: FnMut(u64, &mut [u8])>(rd: &mut R, addr: u64) -> i32 {
    let mut b = [0u8; 2];
    rd(addr, &mut b);
    u16::from_le_bytes(b) as i32
}

pub fn mr_resolve_offset_chain<R: FnMut(u64, &mut [u8])>(
    rd: &mut R,
    mut base: u64,
    offsets: &[i32],
) -> u64 {
    let n = offsets.len();
    if n == 0 {
        return base;
    }
    let mut ptr = mr_u64(rd, base);
    for off in &offsets[..n - 1] {
        base = ptr.wrapping_add(*off as i64 as u64);
        ptr = mr_u64(rd, base);
    }
    ptr.wrapping_add(offsets[n - 1] as i64 as u64)
}

pub fn mr_read_ascii<R: FnMut(u64, &mut [u8])>(rd: &mut R, addr: u64, len: i32) -> Vec<u8> {
    let alloc = if len > 0 { len as usize } else { 1 };
    let mut buf = vec![0u8; alloc];
    rd(addr, &mut buf);
    let mut out: Vec<u8> = Vec::new();
    let mut flag = false;
    let count = if len > 0 { len as usize } else { 0 };
    for &c in buf.iter().take(count) {
        if flag && c == 0 {
            break;
        }
        if c == 0 {
            flag = true;
        } else {
            flag = false;
            out.push(c);
        }
    }
    out
}
