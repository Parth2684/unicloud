use reqwest::Client;
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PermissionRes {
    capabilities: Capability,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Capability {
    can_edit: bool,
}

pub async fn fetch_permissions(file_id: &str, token: &str) -> Result<(), String> {
    let client = Client::new();
    let response = client
        .get(format!(
            "https://www.googleapis.com/drive/v3/files/{}?fields=capabilities(canEdit)",
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
            // println!("{:?}", &resp.json());
            let res = resp.json::<PermissionRes>().await;
            match res {
                Err(err) => {
                    eprintln!("Error parsing data from google: {err:?}");
                    return Err(String::from(
                        "error parsing permission details from google api",
                    ));
                }
                Ok(permission) => {
                    if permission.capabilities.can_edit == false {
                        return Err(String::from(
                            "You are not the editor or the owner of the file please try proxy tunnel",
                        ));
                    } else {
                        Ok(())
                    }
                }
            }
        }
    }
}
