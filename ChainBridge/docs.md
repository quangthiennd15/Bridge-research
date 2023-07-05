- Bridge contract được deploy ở mỗi chain
- Handler contract ở mỗi chain sẽ hd bridge phải làm gì với token
- 1 hoặc nhiều relayers ngoài chuỗi đang chạy để nhậnn các txn từ source và chuyển chúng đến destination

==> Transfer

Lock and mint | burn and release

- Ít yêu cầu với tài sản trên chuỗi nguồn ngoài transfer và lock trong contract

Các bước lock và mint:

- Token trên chuỗi gốc được deposit trong bridge contract và được lock lại
- Sau đó relayers gửi txn mới đến bridge contract trên chuỗi destination
- bridge contract mint token mới vào tài khoản deposit trên chuỗi đích

Đổi token trên chuỗi đích trở lại sử dụng burn và release

- Token trên chuỗi đích được gửi đến bridge contract và được burn
- Sau đó relayers gửi txn mới đến bridge contract trên chuỗi nguồn
- bridge contract unlocks token mới vào deposit chúng
