#[macro_export]
macro_rules! update_if_some {
    ($self:tt, $l:tt) => {
        if let Some($l) = $l {
            $self.$l = $l;
        }
    };
    ($self:tt, $l:tt, $value: expr) => {
        if let Some($l) = $l {
            $self.$l = $value;
        }
    };
}
