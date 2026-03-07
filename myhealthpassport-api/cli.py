import logging
import typer
from tortoise import Tortoise, run_async
from typer import Option

from src.config import TORTOISE_ORM
from src.core.password_manager import create_password_hash
from src.models.user_models import AdminTeam, AdminTeamRoles


from src.static_data.insert_vaccines import populate_vaccinations
from src.static_data.questions import populate_questions

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

cli_app = typer.Typer()


@cli_app.command()
def create_superuser(
    username: str = Option(..., prompt=True, help="Superuser username"),
    email: str = Option(..., prompt=True, help="Superuser email"),
    phone: str = Option(..., prompt=True, help="Superuser phone"),
    first_name: str = Option("Admin", help="First name"),
    last_name: str = Option("User", help="Last name"),
):
    async def _create():
        await Tortoise.init(config=TORTOISE_ORM)

        # Here Insert Static Data
        await populate_vaccinations()
        await populate_questions()

        existing_user = await AdminTeam.filter(username=username).first()
        if existing_user:
            typer.echo(f"⚠️ AdminTeam user with username '{username}' already exists.")
            await Tortoise.close_connections()
            raise typer.Exit(code=1)

        existing_email = await AdminTeam.filter(email=email).first()
        if existing_email:
             typer.echo(f"⚠️ AdminTeam user with email '{email}' already exists.")
             await Tortoise.close_connections()
             raise typer.Exit(code=1)

        existing_phone = await AdminTeam.filter(phone=phone).first()
        if existing_phone:
             typer.echo(f"⚠️ AdminTeam user with phone '{phone}' already exists.")
             await Tortoise.close_connections()
             raise typer.Exit(code=1)

        password = typer.prompt(
            "Enter password", hide_input=True, confirmation_prompt=True
        )
        hashed_password = create_password_hash(password)

        try:
            user = await AdminTeam.create(
                username=username,
                email=email,
                phone=phone,
                first_name=first_name,
                last_name=last_name,
                user_role=AdminTeamRoles.SUPER_ADMIN,
                password=hashed_password,
                is_active=True,
                is_verified=True,
            )

            typer.echo(f"✅ Superuser '{user.username}' created successfully in AdminTeam table.")

        except Exception as e:
            logger.error(f"Error creating superuser: {e}")
            typer.echo(f"❌ Error creating superuser: {e}")
            raise typer.Exit(code=1)

        finally:
            await Tortoise.close_connections()

    run_async(_create())


if __name__ == "__main__":
    cli_app()