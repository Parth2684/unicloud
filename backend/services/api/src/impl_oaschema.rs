use std::ops::Deref;

use axum::{extract::FromRequestParts, response::{IntoResponse, Redirect, Response}};
use axum_extra::extract::{CookieJar, cookie::Cookie};
use http::request::Parts;
use oasgen::{OaSchema, Schema, register_schema};

pub struct OaRedirect(pub Redirect);

impl OaSchema for OaRedirect {
    fn schema() -> Schema {
        Schema::new_string()
    }
}

impl OaRedirect {
    pub fn to(uri: &str) -> Self {
        Self(Redirect::to(uri))
    }
}


impl IntoResponse for OaRedirect {
    fn into_response(self) -> Response {
        self.0.into_response()
    }
}

register_schema!("OaRedirect", &|| OaRedirect::schema());


pub struct OaCookieJar(pub CookieJar);

impl OaSchema for OaCookieJar {
    fn schema() -> Schema {
        Schema::new_string()
    }
}


impl Deref for OaCookieJar {
    type Target = CookieJar;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl OaCookieJar {
    pub fn get(&self, name: &str) -> Option<&Cookie<'static>> {
        CookieJar::get(&self.0, name)
    }
    pub fn remove<C:  Into<Cookie<'static>>>(self, cookie: C) -> Self {
        OaCookieJar(CookieJar::remove(self.0, cookie))
    }
}
impl<S> FromRequestParts<S> for OaCookieJar
where
    S: Send + Sync,
{
    type Rejection = <CookieJar as FromRequestParts<S>>::Rejection;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &S,
    ) -> Result<Self, Self::Rejection> {
        CookieJar::from_request_parts(parts, state)
            .await
            .map(Self)
    }
}


impl IntoResponse for OaCookieJar {
    fn into_response(self) -> Response {
        self.0.into_response()
    }
}