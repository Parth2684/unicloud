use common::export_envs::ENVS;
use tokio_tungstenite::{connect_async, tungstenite::Message};
use url::Url;

use futures_util::SinkExt;

pub async fn refresh_clouds(jwt: &str) {
    let connect_url = Url::parse(&ENVS.websocket_url).ok();
    if let Some(mut url) = connect_url {
        url.query_pairs_mut().append_pair("token", jwt);
        if let Ok((mut ws_stream, _response)) = connect_async(url.as_str()).await {
            let message_to_send = Message::Text("Refresh Token".into());
            let _ = ws_stream.send(message_to_send).await;
        }
    }
}
