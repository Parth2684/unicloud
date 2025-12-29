use reqwest::Client;
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Capabilities {
    can_share: bool,
    can_copy: bool,
}
pub async fn fetch_permissions(file_id: &str, token: &str) -> Result<(), String> {
    let client = Client::new();
    let response = client
        .get(format!(
            "https://www.googleapis.com/drive/v3/files/{}?fields=capabilities",
            file_id
        ))
        .bearer_auth(token)
        .send()
        .await;
    match response {
        Err(err) => {
            eprintln!("error getting permission from google: {err:?}");
            return Err(String::from(
                "error getting permission from google, try again",
            ));
        }
        Ok(resp) => {
            let res = resp.json::<Capabilities>().await;
            match res {
                Err(err) => {
                    eprintln!("Error parsing data from google: {err:?}");
                    return Err(String::from(
                        "error parsing permission details from google api",
                    ));
                }
                Ok(capabilities) => {
                    if capabilities.can_copy | capabilities.can_share {
                        return Ok(());
                    } else {
                        return Err(String::from(
                            "You don't have enough permissions to copy or share this file, Try proxy tunnel",
                        ));
                    }
                }
            }
        }
    }
}
